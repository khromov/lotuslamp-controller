/**
 * LotusLamp X / ELK-BLEDOB Bluetooth Controller
 * Web Bluetooth API implementation for controlling RGB LED strips
 */

// Debug logger that shows in UI
function debugLog(msg, type = 'info') {
    console.log(msg);
    const logEl = document.getElementById('debug-log');
    if (logEl) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }
}

class LotusLampBluetooth {
    // BLE Service and Characteristic UUIDs
    static SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
    static CHAR_UUIDS = [
        '0000fff3-0000-1000-8000-00805f9b34fb',
        '0000ffe1-0000-1000-8000-00805f9b34fb'
    ];

    // Alternative service UUIDs for different device variants
    static ALT_SERVICE_UUIDS = [
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000ffd0-0000-1000-8000-00805f9b34fb',
        '0000ffe5-0000-1000-8000-00805f9b34fb',
        '0000ffd5-0000-1000-8000-00805f9b34fb'
    ];

    static ALT_CHAR_UUIDS = [
        '0000fff3-0000-1000-8000-00805f9b34fb',
        '0000ffe1-0000-1000-8000-00805f9b34fb',
        '0000ffe9-0000-1000-8000-00805f9b34fb',
        '0000ffd9-0000-1000-8000-00805f9b34fb'
    ];

    // Command constants
    static CMD = {
        HEADER: 0x7e,
        FOOTER: 0xef,
        POWER_ON: [0x7e, 0x07, 0x04, 0xff, 0x00, 0x01, 0x02, 0x01, 0xef],
        POWER_OFF: [0x7e, 0x07, 0x04, 0x00, 0x00, 0x00, 0x02, 0x01, 0xef],
        INIT: [0x7e, 0x06, 0x83, 0x0f, 0x20, 0x0c, 0x06, 0x00, 0xef]
    };

    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.onConnectionChange = null;
        this.onError = null;
    }

    /**
     * Check if Web Bluetooth is supported
     */
    static isSupported() {
        return 'bluetooth' in navigator;
    }

    /**
     * Connect to a LotusLamp X device
     */
    async connect() {
        if (!LotusLampBluetooth.isSupported()) {
            throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
        }

        try {
            // Request device - accept all devices to find the lamp
            // Include many possible service UUIDs for LED controllers
            const allPossibleServices = [
                // Standard bases with common suffixes
                '0000fff0-0000-1000-8000-00805f9b34fb',
                '0000ffe0-0000-1000-8000-00805f9b34fb',
                '0000ffd0-0000-1000-8000-00805f9b34fb',
                '0000ffe5-0000-1000-8000-00805f9b34fb',
                '0000ffd5-0000-1000-8000-00805f9b34fb',
                '0000ff00-0000-1000-8000-00805f9b34fb',
                '0000ff01-0000-1000-8000-00805f9b34fb',
                '0000ffb0-0000-1000-8000-00805f9b34fb',
                // Short UUIDs (16-bit)
                0xfff0, 0xffe0, 0xffd0, 0xffe5, 0xffd5,
                0xff00, 0xffb0, 0x1800, 0x1801,
                // Generic
                'generic_access',
                'generic_attribute'
            ];

            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: allPossibleServices
            });

            // Listen for disconnection
            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnect();
            });

            debugLog(`Device selected: ${this.device.name}`);

            // Connect to GATT server with retry
            debugLog('Connecting to GATT server...');
            let retries = 3;
            while (retries > 0) {
                try {
                    this.server = await this.device.gatt.connect();
                    debugLog('Connected to GATT server');
                    break;
                } catch (e) {
                    retries--;
                    debugLog(`GATT connection failed: ${e.message}, retries left: ${retries}`, 'error');
                    if (retries === 0) throw e;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // Try to find a working service and characteristic
            await this.findServiceAndCharacteristic();

            // Send initialization command (skip if no characteristic found)
            if (this.characteristic) {
                try {
                    await this.sendCommand(LotusLampBluetooth.CMD.INIT);
                    debugLog('Initialization command sent');
                } catch (e) {
                    debugLog(`Init command failed (may be normal): ${e.message}`);
                }
            }

            this.isConnected = true;
            if (this.onConnectionChange) {
                this.onConnectionChange(true, this.device.name);
            }

            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            this.handleDisconnect();
            throw error;
        }
    }

    /**
     * Find a working service and characteristic combination
     */
    async findServiceAndCharacteristic() {
        // First, let's discover what services this device actually has
        debugLog('Discovering services...');

        try {
            const services = await this.server.getPrimaryServices();
            debugLog(`Found ${services.length} services`);

            // First pass: log ALL services and characteristics
            let candidates = [];
            for (const service of services) {
                debugLog(`  Service: ${service.uuid}`);
                try {
                    const chars = await service.getCharacteristics();
                    for (const char of chars) {
                        const props = [];
                        if (char.properties.write) props.push('write');
                        if (char.properties.writeWithoutResponse) props.push('writeNoResp');
                        if (char.properties.read) props.push('read');
                        if (char.properties.notify) props.push('notify');
                        debugLog(`    Char: ${char.uuid} [${props.join(', ')}]`);

                        // Collect writable characteristics, but skip standard BLE services
                        if ((char.properties.write || char.properties.writeWithoutResponse) &&
                            !service.uuid.startsWith('00001800') && // Generic Access
                            !service.uuid.startsWith('00001801')) { // Generic Attribute
                            candidates.push({ service, char });
                        }
                    }
                } catch (e) {
                    debugLog(`    Could not get characteristics: ${e.message}`, 'error');
                }
            }

            // Select the best candidate (prefer fff-series UUIDs used by LED controllers)
            if (candidates.length > 0) {
                // Prefer characteristics with 'fff' or 'ffe' in UUID
                let best = candidates.find(c =>
                    c.char.uuid.includes('fff') || c.char.uuid.includes('ffe')
                ) || candidates[0];

                this.service = best.service;
                this.characteristic = best.char;
                debugLog(`Selected: ${best.char.uuid} from service ${best.service.uuid}`, 'success');
                return;
            }
        } catch (e) {
            debugLog(`Could not discover services: ${e.message}`, 'error');
        }

        // Fallback: try known UUIDs
        const serviceUUIDs = LotusLampBluetooth.ALT_SERVICE_UUIDS;
        const charUUIDs = LotusLampBluetooth.ALT_CHAR_UUIDS;

        for (const serviceUUID of serviceUUIDs) {
            try {
                this.service = await this.server.getPrimaryService(serviceUUID);
                debugLog(`Found service: ${serviceUUID}`);

                for (const charUUID of charUUIDs) {
                    try {
                        this.characteristic = await this.service.getCharacteristic(charUUID);
                        debugLog(`Found characteristic: ${charUUID}`);
                        return;
                    } catch (e) {
                        // Try next characteristic
                    }
                }
            } catch (e) {
                // Try next service
            }
        }

        throw new Error('Could not find compatible BLE service/characteristic. Check browser console for available services.');
    }

    /**
     * Disconnect from device
     */
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        this.handleDisconnect();
    }

    /**
     * Handle disconnection event
     */
    handleDisconnect() {
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;

        if (this.onConnectionChange) {
            this.onConnectionChange(false);
        }
    }

    /**
     * Send raw command to device
     */
    async sendCommand(command) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Not connected to device');
        }

        const data = new Uint8Array(command);
        debugLog(`Sending: ${Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

        try {
            await this.characteristic.writeValue(data);
        } catch (error) {
            console.error('Failed to send command:', error);
            throw error;
        }
    }

    /**
     * Turn LED on
     */
    async powerOn() {
        await this.sendCommand(LotusLampBluetooth.CMD.POWER_ON);
    }

    /**
     * Turn LED off
     */
    async powerOff() {
        await this.sendCommand(LotusLampBluetooth.CMD.POWER_OFF);
    }

    /**
     * Set RGB color
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     */
    async setColor(r, g, b) {
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));

        const command = [0x7e, 0x07, 0x05, 0x03, r, g, b, 0x10, 0xef];
        await this.sendCommand(command);
    }

    /**
     * Set brightness
     * @param {number} level - Brightness level (1-100)
     */
    async setBrightness(level) {
        level = Math.max(1, Math.min(100, Math.round(level)));
        const command = [0x7e, 0x04, 0x01, level, 0x01, 0xff, 0x02, 0x01, 0xef];
        await this.sendCommand(command);
    }

    /**
     * Set effect mode
     * @param {number} mode - Effect mode (0-255, common range 135-156)
     */
    async setEffect(mode) {
        mode = Math.max(0, Math.min(255, Math.round(mode)));
        const command = [0x7e, 0x07, 0x03, mode, 0x03, 0xff, 0xff, 0x00, 0xef];
        await this.sendCommand(command);
    }

    /**
     * Set effect with custom color
     * Some devices support setting effect + color together
     * @param {number} mode - Effect mode
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     */
    async setEffectWithColor(mode, r, g, b) {
        mode = Math.max(0, Math.min(255, Math.round(mode)));
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));

        // Try different command formats that some devices use
        // Format 1: effect mode with RGB in the command
        const command = [0x7e, 0x07, 0x03, mode, r, g, b, 0x00, 0xef];
        await this.sendCommand(command);
    }

    /**
     * Set DIY/Custom colors for effects
     * Many ELK-BLEDOM devices support setting custom colors that effects use
     * @param {Array} colors - Array of {r, g, b} objects (up to 7 colors)
     */
    async setEffectColors(colors) {
        // Pad to 7 colors if needed
        while (colors.length < 7) {
            colors.push(colors[colors.length - 1] || {r: 255, g: 0, b: 0});
        }

        // Command format for DIY colors: 7e 07 12 [r1] [g1] [b1] 01 ef for color 1
        // Then 7e 07 12 [r2] [g2] [b2] 02 ef for color 2, etc.
        for (let i = 0; i < Math.min(colors.length, 7); i++) {
            const c = colors[i];
            const command = [0x7e, 0x07, 0x12, c.r, c.g, c.b, i + 1, 0x00, 0xef];
            await this.sendCommand(command);
            await new Promise(r => setTimeout(r, 50)); // Small delay between commands
        }
    }

    /**
     * Set effect speed
     * @param {number} speed - Speed (1-100)
     */
    async setEffectSpeed(speed) {
        speed = Math.max(1, Math.min(100, Math.round(speed)));
        const command = [0x7e, 0x07, 0x02, speed, 0xff, 0xff, 0xff, 0x00, 0xef];
        await this.sendCommand(command);
    }
}

// Export for use in app.js
window.LotusLampBluetooth = LotusLampBluetooth;
