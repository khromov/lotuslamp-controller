/**
 * LotusLamp X Controller - Main Application
 */

class LotusLampApp {
    constructor() {
        this.bluetooth = new LotusLampBluetooth();
        this.currentColor = { r: 255, g: 0, b: 0 };
        this.patternInterval = null;
        this.patternSteps = [{ color: '#ff0000', duration: 500 }];
        this.savedPatterns = this.loadPatterns();

        this.init();
    }

    init() {
        // Check browser support
        if (!LotusLampBluetooth.isSupported()) {
            this.showError('Web Bluetooth is not supported. Please use Chrome, Edge, or Opera on desktop.');
            document.getElementById('connect-btn').disabled = true;
            return;
        }

        // Set up event listeners
        this.setupConnectionHandlers();
        this.setupColorControls();
        this.setupBrightnessControl();
        this.setupPresetColors();
        this.setupEffectControls();
        this.setupPatternControls();
        this.drawColorWheel();
        this.renderSavedPatterns();

        // Bluetooth connection change callback
        this.bluetooth.onConnectionChange = (connected, deviceName) => {
            this.updateConnectionStatus(connected, deviceName);
        };
    }

    // ==================== Connection ====================

    setupConnectionHandlers() {
        document.getElementById('connect-btn').addEventListener('click', () => this.connect());
        document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());
        document.getElementById('power-on').addEventListener('click', () => this.powerOn());
        document.getElementById('power-off').addEventListener('click', () => this.powerOff());
    }

    async connect() {
        const btn = document.getElementById('connect-btn');
        btn.textContent = 'Connecting...';
        btn.disabled = true;

        try {
            await this.bluetooth.connect();
        } catch (error) {
            this.showError(`Connection failed: ${error.message}`);
            btn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg> Connect via Bluetooth`;
            btn.disabled = false;
        }
    }

    async disconnect() {
        await this.bluetooth.disconnect();
    }

    updateConnectionStatus(connected, deviceName = '') {
        const status = document.getElementById('connection-status');
        const statusText = status.querySelector('.status-text');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');

        const controlSections = [
            'power-section', 'color-section', 'brightness-section',
            'presets-section', 'effects-section', 'patterns-section'
        ];

        if (connected) {
            status.className = 'status connected';
            statusText.textContent = deviceName || 'Connected';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'block';

            controlSections.forEach(id => {
                document.getElementById(id).style.display = 'block';
            });
        } else {
            status.className = 'status disconnected';
            statusText.textContent = 'Disconnected';
            connectBtn.style.display = 'block';
            connectBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg> Connect via Bluetooth`;
            connectBtn.disabled = false;
            disconnectBtn.style.display = 'none';

            controlSections.forEach(id => {
                document.getElementById(id).style.display = 'none';
            });

            this.stopPattern();
        }
    }

    async powerOn() {
        try {
            await this.bluetooth.powerOn();
        } catch (error) {
            this.showError(`Power on failed: ${error.message}`);
        }
    }

    async powerOff() {
        try {
            await this.bluetooth.powerOff();
        } catch (error) {
            this.showError(`Power off failed: ${error.message}`);
        }
    }

    // ==================== Color Controls ====================

    setupColorControls() {
        const redSlider = document.getElementById('red-slider');
        const greenSlider = document.getElementById('green-slider');
        const blueSlider = document.getElementById('blue-slider');
        const colorInput = document.getElementById('color-input');
        const applyBtn = document.getElementById('apply-color');
        const colorWheel = document.getElementById('color-wheel');

        // RGB sliders
        [redSlider, greenSlider, blueSlider].forEach(slider => {
            slider.addEventListener('input', () => this.updateColorFromSliders());
        });

        // Native color picker
        colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            const rgb = this.hexToRgb(hex);
            this.currentColor = rgb;
            this.updateColorUI();
        });

        // Apply button
        applyBtn.addEventListener('click', () => this.applyColor());

        // Color wheel interaction
        colorWheel.addEventListener('click', (e) => this.handleColorWheelClick(e));
        colorWheel.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) this.handleColorWheelClick(e);
        });
    }

    drawColorWheel() {
        const canvas = document.getElementById('color-wheel');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5;

        // Draw color wheel
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle - 1) * Math.PI / 180;
            const endAngle = (angle + 1) * Math.PI / 180;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    handleColorWheelClick(e) {
        const canvas = document.getElementById('color-wheel');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = Math.min(centerX, centerY) - 5;

        if (distance <= radius) {
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const hue = (angle + 360) % 360;
            const saturation = Math.min(distance / radius, 1) * 100;

            const rgb = this.hslToRgb(hue, saturation, 50);
            this.currentColor = rgb;
            this.updateColorUI();

            // Update cursor position
            const cursor = document.getElementById('color-cursor');
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            cursor.style.display = 'block';
        }
    }

    updateColorFromSliders() {
        this.currentColor = {
            r: parseInt(document.getElementById('red-slider').value),
            g: parseInt(document.getElementById('green-slider').value),
            b: parseInt(document.getElementById('blue-slider').value)
        };
        this.updateColorUI();
    }

    updateColorUI() {
        const { r, g, b } = this.currentColor;

        // Update sliders
        document.getElementById('red-slider').value = r;
        document.getElementById('green-slider').value = g;
        document.getElementById('blue-slider').value = b;

        // Update value displays
        document.getElementById('red-value').textContent = r;
        document.getElementById('green-value').textContent = g;
        document.getElementById('blue-value').textContent = b;

        // Update preview
        const preview = document.getElementById('color-preview');
        preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

        // Update native color input
        document.getElementById('color-input').value = this.rgbToHex(r, g, b);
    }

    async applyColor() {
        try {
            await this.bluetooth.setColor(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        } catch (error) {
            this.showError(`Failed to set color: ${error.message}`);
        }
    }

    // ==================== Brightness ====================

    setupBrightnessControl() {
        const slider = document.getElementById('brightness-slider');
        const value = document.getElementById('brightness-value');
        let debounceTimer = null;

        // Auto-apply brightness as slider moves (debounced)
        slider.addEventListener('input', () => {
            value.textContent = `${slider.value}%`;

            // Debounce to avoid flooding BLE commands
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    await this.bluetooth.setBrightness(parseInt(slider.value));
                } catch (error) {
                    console.error('Brightness error:', error);
                }
            }, 100);
        });
    }

    // ==================== Preset Colors ====================

    setupPresetColors() {
        document.querySelectorAll('.preset-color').forEach(btn => {
            btn.addEventListener('click', async () => {
                const r = parseInt(btn.dataset.r);
                const g = parseInt(btn.dataset.g);
                const b = parseInt(btn.dataset.b);

                this.currentColor = { r, g, b };
                this.updateColorUI();

                try {
                    await this.bluetooth.setColor(r, g, b);
                } catch (error) {
                    this.showError(`Failed to set color: ${error.message}`);
                }
            });
        });
    }

    // ==================== Built-in Device Effects ====================

    setupEffectControls() {
        this.scanInterval = null;
        this.scanning = false;
        this.favoritesModes = this.loadFavorites();
        this.effectColors = ['#ff0000', '#00ff00', '#0000ff'];

        // Setup effect colors
        this.setupEffectColors();

        // Speed slider - auto-apply when changed
        const speedSlider = document.getElementById('effect-speed');
        const speedValue = document.getElementById('speed-value');
        let speedDebounce = null;

        speedSlider.addEventListener('input', () => {
            speedValue.textContent = `${speedSlider.value}%`;
            clearTimeout(speedDebounce);
            speedDebounce = setTimeout(async () => {
                // Send speed to device for built-in effects
                try {
                    await this.bluetooth.setEffectSpeed(parseInt(speedSlider.value));
                    debugLog(`Speed set to ${speedSlider.value}%`);
                } catch (e) {
                    console.error('Speed error:', e);
                }

                // If a software pattern is running, restart it with new speed
                if (this.softwarePatternRunning) {
                    const activeBtn = document.querySelector('.software-btn.active');
                    if (activeBtn) {
                        this.playSoftwarePattern(activeBtn.dataset.pattern);
                    }
                }
            }, 100);
        });

        // Built-in effect buttons (modes 135-156)
        document.querySelectorAll('.builtin-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const mode = parseInt(btn.dataset.mode);
                await this.sendBuiltinMode(mode);
                // Highlight active
                document.querySelectorAll('.builtin-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });

            // Add star button for favorites
            const starBtn = document.createElement('button');
            starBtn.className = 'star-btn';
            starBtn.innerHTML = this.favoritesModes.includes(parseInt(btn.dataset.mode)) ? '★' : '☆';
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(parseInt(btn.dataset.mode), starBtn);
            });
            btn.appendChild(starBtn);
        });

        // Custom mode input
        document.getElementById('send-mode')?.addEventListener('click', async () => {
            const mode = parseInt(document.getElementById('custom-mode').value);
            if (mode >= 0 && mode <= 255) {
                await this.sendBuiltinMode(mode);
            }
        });

        // Mode scanner
        document.getElementById('scan-modes')?.addEventListener('click', () => this.startModeScan());
        document.getElementById('stop-scan')?.addEventListener('click', () => this.stopModeScan());

        // Quick range buttons
        document.querySelectorAll('.range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('scan-start').value = btn.dataset.start;
                document.getElementById('scan-end').value = btn.dataset.end;
            });
        });

        // Stop effect button - return to solid color
        document.getElementById('stop-effect')?.addEventListener('click', async () => {
            this.stopModeScan();
            try {
                await this.bluetooth.setColor(this.currentColor.r, this.currentColor.g, this.currentColor.b);
                debugLog('Stopped effect, returned to solid color');
            } catch (e) {
                console.error('Stop effect error:', e);
            }
        });

        // Render favorites
        this.renderFavorites();
    }

    async sendBuiltinMode(mode) {
        try {
            await this.bluetooth.setEffect(mode);
            debugLog(`Sent built-in mode: ${mode} (0x${mode.toString(16)})`);
        } catch (error) {
            this.showError(`Failed to set mode ${mode}: ${error.message}`);
        }
    }

    async startModeScan() {
        const startMode = parseInt(document.getElementById('scan-start').value);
        const endMode = parseInt(document.getElementById('scan-end').value);

        if (startMode > endMode || startMode < 0 || endMode > 255) {
            this.showError('Invalid scan range');
            return;
        }

        this.scanning = true;
        document.getElementById('scan-modes').style.display = 'none';
        document.getElementById('stop-scan').style.display = 'inline-block';

        let currentMode = startMode;
        const statusEl = document.getElementById('scan-status');

        const scanNext = async () => {
            if (!this.scanning || currentMode > endMode) {
                this.stopModeScan();
                return;
            }

            statusEl.textContent = `Testing mode ${currentMode} of ${endMode}...`;
            statusEl.className = 'scan-status active';

            try {
                await this.bluetooth.setEffect(currentMode);
                debugLog(`Scanning: mode ${currentMode} (0x${currentMode.toString(16)})`);
            } catch (e) {
                debugLog(`Mode ${currentMode} failed: ${e.message}`, 'error');
            }

            currentMode++;
            this.scanInterval = setTimeout(scanNext, 2000); // 2 sec per mode to see the effect
        };

        scanNext();
    }

    stopModeScan() {
        this.scanning = false;
        if (this.scanInterval) {
            clearTimeout(this.scanInterval);
            this.scanInterval = null;
        }
        document.getElementById('scan-modes').style.display = 'inline-block';
        document.getElementById('stop-scan').style.display = 'none';
        document.getElementById('scan-status').textContent = '';
        document.getElementById('scan-status').className = 'scan-status';
    }

    toggleFavorite(mode, starBtn) {
        const index = this.favoritesModes.indexOf(mode);
        if (index > -1) {
            this.favoritesModes.splice(index, 1);
            starBtn.innerHTML = '☆';
        } else {
            this.favoritesModes.push(mode);
            starBtn.innerHTML = '★';
        }
        this.saveFavorites();
        this.renderFavorites();
    }

    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('lotusLampFavorites')) || [];
        } catch {
            return [];
        }
    }

    saveFavorites() {
        localStorage.setItem('lotusLampFavorites', JSON.stringify(this.favoritesModes));
    }

    renderFavorites() {
        const grid = document.getElementById('favorites-grid');
        if (this.favoritesModes.length === 0) {
            grid.innerHTML = '<p class="no-favorites">No favorites yet - discover modes and star them!</p>';
            return;
        }

        grid.innerHTML = this.favoritesModes.map(mode => `
            <button class="builtin-btn favorite-btn" data-mode="${mode}" title="Mode ${mode}">
                <span class="mode-num">${mode}</span>
                <span>Mode ${mode}</span>
                <button class="remove-fav-btn" data-mode="${mode}">&times;</button>
            </button>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (e.target.classList.contains('remove-fav-btn')) return;
                const mode = parseInt(btn.dataset.mode);
                await this.sendBuiltinMode(mode);
            });
        });

        grid.querySelectorAll('.remove-fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = parseInt(btn.dataset.mode);
                this.favoritesModes = this.favoritesModes.filter(m => m !== mode);
                this.saveFavorites();
                this.renderFavorites();
                // Update star in main grid
                const mainBtn = document.querySelector(`.builtin-btn[data-mode="${mode}"] .star-btn`);
                if (mainBtn) mainBtn.innerHTML = '☆';
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== Effect Colors & Software Patterns ====================

    setupEffectColors() {
        this.softwarePatternRunning = false;
        this.softwarePatternInterval = null;

        // Add color button
        document.getElementById('add-effect-color')?.addEventListener('click', () => {
            if (this.effectColors.length >= 7) {
                debugLog('Maximum 7 colors allowed');
                return;
            }
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            this.effectColors.push(randomColor);
            this.renderEffectColors();
        });

        // Software pattern buttons
        document.querySelectorAll('.software-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.software-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.playSoftwarePattern(btn.dataset.pattern);
            });
        });

        // Stop software pattern
        document.getElementById('stop-software-pattern')?.addEventListener('click', () => {
            this.stopSoftwarePattern();
        });

        this.renderEffectColors();
    }

    renderEffectColors() {
        const row = document.getElementById('effect-colors-row');
        const addBtn = document.getElementById('add-effect-color');

        // Remove existing color items (keep add button)
        row.querySelectorAll('.effect-color-item').forEach(el => el.remove());

        // Add color inputs
        this.effectColors.forEach((color, index) => {
            const item = document.createElement('div');
            item.className = 'effect-color-item';
            item.innerHTML = `
                <input type="color" class="effect-color-input" value="${color}">
                <button class="remove-color-btn">&times;</button>
            `;

            const input = item.querySelector('input');
            input.addEventListener('input', (e) => {
                this.effectColors[index] = e.target.value;
            });

            const removeBtn = item.querySelector('.remove-color-btn');
            removeBtn.addEventListener('click', () => {
                if (this.effectColors.length > 1) {
                    this.effectColors.splice(index, 1);
                    this.renderEffectColors();
                }
            });

            row.insertBefore(item, addBtn);
        });
    }

    // Software patterns - use custom colors
    async playSoftwarePattern(pattern) {
        this.stopSoftwarePattern();
        this.softwarePatternRunning = true;

        const speed = parseInt(document.getElementById('effect-speed').value);
        const baseDelay = Math.max(50, 500 - (speed * 4)); // 50ms to 500ms
        const colors = this.effectColors.map(c => this.hexToRgb(c));

        debugLog(`Starting software pattern: ${pattern} with ${colors.length} colors`);

        switch (pattern) {
            case 'cycle':
                this.runSoftwareCycle(colors, baseDelay);
                break;
            case 'fade':
                this.runSoftwareFade(colors, baseDelay);
                break;
            case 'pulse':
                this.runSoftwarePulse(colors, baseDelay);
                break;
            case 'strobe':
                this.runSoftwareStrobe(colors, baseDelay / 3);
                break;
            case 'breathe':
                this.runSoftwareBreathe(colors, baseDelay * 2);
                break;
            case 'flash':
                this.runSoftwareFlash(colors, baseDelay);
                break;
            case 'smooth':
                this.runSoftwareSmooth(colors, baseDelay);
                break;
            case 'random':
                this.runSoftwareRandom(colors, baseDelay);
                break;
            case 'wave':
                this.runSoftwareWave(colors, baseDelay);
                break;
            case 'bounce':
                this.runSoftwareBounce(colors, baseDelay);
                break;
            case 'comet':
                this.runSoftwareComet(colors, baseDelay);
                break;
            case 'sparkle':
                this.runSoftwareSparkle(colors, baseDelay);
                break;
            case 'converge':
                this.runSoftwareConverge(colors, baseDelay);
                break;
        }
    }

    stopSoftwarePattern() {
        this.softwarePatternRunning = false;
        if (this.softwarePatternInterval) {
            clearTimeout(this.softwarePatternInterval);
            this.softwarePatternInterval = null;
        }
        document.querySelectorAll('.software-btn').forEach(b => b.classList.remove('active'));
        debugLog('Software pattern stopped');
    }

    // Pattern: Simple color cycle
    async runSoftwareCycle(colors, delay) {
        let i = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const c = colors[i % colors.length];
            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
            } catch (e) { /* ignore */ }
            i++;
            this.softwarePatternInterval = setTimeout(run, delay);
        };
        run();
    }

    // Pattern: Smooth fade between colors
    async runSoftwareFade(colors, delay) {
        let i = 0;
        const steps = 15;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const fromColor = colors[i % colors.length];
            const toColor = colors[(i + 1) % colors.length];

            for (let s = 0; s <= steps && this.softwarePatternRunning; s++) {
                const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * (s / steps));
                const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * (s / steps));
                const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * (s / steps));
                try {
                    await this.bluetooth.setColor(r, g, b);
                } catch (e) { /* ignore */ }
                await this.sleep(delay / steps);
            }
            i++;
            this.softwarePatternInterval = setTimeout(run, 0);
        };
        run();
    }

    // Pattern: Pulse brightness
    async runSoftwarePulse(colors, delay) {
        let i = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const c = colors[i % colors.length];
            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                // Pulse brightness up
                for (let b = 20; b <= 100 && this.softwarePatternRunning; b += 10) {
                    await this.bluetooth.setBrightness(b);
                    await this.sleep(delay / 20);
                }
                // Pulse brightness down
                for (let b = 100; b >= 20 && this.softwarePatternRunning; b -= 10) {
                    await this.bluetooth.setBrightness(b);
                    await this.sleep(delay / 20);
                }
            } catch (e) { /* ignore */ }
            i++;
            this.softwarePatternInterval = setTimeout(run, delay / 4);
        };
        run();
    }

    // Pattern: Strobe
    async runSoftwareStrobe(colors, delay) {
        let i = 0;
        let on = true;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            try {
                if (on) {
                    const c = colors[i % colors.length];
                    await this.bluetooth.setColor(c.r, c.g, c.b);
                } else {
                    await this.bluetooth.setColor(0, 0, 0);
                    i++;
                }
            } catch (e) { /* ignore */ }
            on = !on;
            this.softwarePatternInterval = setTimeout(run, delay);
        };
        run();
    }

    // Pattern: Breathe (slow fade in/out)
    async runSoftwareBreathe(colors, delay) {
        let i = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const c = colors[i % colors.length];
            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                // Breathe in
                for (let b = 5; b <= 100 && this.softwarePatternRunning; b += 5) {
                    await this.bluetooth.setBrightness(b);
                    await this.sleep(delay / 40);
                }
                await this.sleep(delay / 4);
                // Breathe out
                for (let b = 100; b >= 5 && this.softwarePatternRunning; b -= 5) {
                    await this.bluetooth.setBrightness(b);
                    await this.sleep(delay / 40);
                }
            } catch (e) { /* ignore */ }
            i++;
            this.softwarePatternInterval = setTimeout(run, delay / 4);
        };
        run();
    }

    // Pattern: Flash
    async runSoftwareFlash(colors, delay) {
        let i = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const c = colors[i % colors.length];
            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.sleep(delay / 4);
                await this.bluetooth.setColor(0, 0, 0);
                await this.sleep(delay / 4);
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.sleep(delay / 4);
                await this.bluetooth.setColor(0, 0, 0);
            } catch (e) { /* ignore */ }
            i++;
            this.softwarePatternInterval = setTimeout(run, delay);
        };
        run();
    }

    // Pattern: Smooth blend through all colors
    async runSoftwareSmooth(colors, delay) {
        let t = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const totalColors = colors.length;
            const position = (t % (totalColors * 100)) / 100;
            const idx1 = Math.floor(position) % totalColors;
            const idx2 = (idx1 + 1) % totalColors;
            const blend = position - Math.floor(position);

            const c1 = colors[idx1];
            const c2 = colors[idx2];

            const r = Math.round(c1.r + (c2.r - c1.r) * blend);
            const g = Math.round(c1.g + (c2.g - c1.g) * blend);
            const b = Math.round(c1.b + (c2.b - c1.b) * blend);

            try {
                await this.bluetooth.setColor(r, g, b);
            } catch (e) { /* ignore */ }
            t++;
            this.softwarePatternInterval = setTimeout(run, delay / 20);
        };
        run();
    }

    // Pattern: Random colors from palette
    async runSoftwareRandom(colors, delay) {
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const c = colors[Math.floor(Math.random() * colors.length)];
            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
            } catch (e) { /* ignore */ }
            this.softwarePatternInterval = setTimeout(run, delay + Math.random() * delay);
        };
        run();
    }

    // Pattern: Wave - simulates motion with brightness oscillation through colors
    async runSoftwareWave(colors, delay) {
        let phase = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;

            // Cycle through colors with sine-wave brightness to simulate movement
            const colorIndex = Math.floor(phase / 50) % colors.length;
            const c = colors[colorIndex];

            // Create wave effect with brightness
            const wave = (Math.sin(phase * 0.15) + 1) / 2; // 0 to 1
            const brightness = Math.round(20 + wave * 80); // 20% to 100%

            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.bluetooth.setBrightness(brightness);
            } catch (e) { /* ignore */ }

            phase++;
            this.softwarePatternInterval = setTimeout(run, delay / 15);
        };
        run();
    }

    // Pattern: Bounce - colors go back and forth with brightness creating motion illusion
    async runSoftwareBounce(colors, delay) {
        let position = 0;
        let direction = 1;
        const steps = 20;

        const run = async () => {
            if (!this.softwarePatternRunning) return;

            // Map position to color index
            const colorIndex = Math.floor((position / steps) * colors.length) % colors.length;
            const c = colors[colorIndex];

            // Brightness follows position (brighter in middle, dimmer at edges)
            const normalizedPos = position / steps; // 0 to 1
            const brightness = Math.round(30 + Math.sin(normalizedPos * Math.PI) * 70);

            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.bluetooth.setBrightness(brightness);
            } catch (e) { /* ignore */ }

            position += direction;
            if (position >= steps) {
                direction = -1;
            } else if (position <= 0) {
                direction = 1;
            }

            this.softwarePatternInterval = setTimeout(run, delay / 10);
        };
        run();
    }

    // Pattern: Comet - rapid fade from bright to dim through colors (simulates comet tail)
    async runSoftwareComet(colors, delay) {
        let colorIndex = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;
            const c = colors[colorIndex % colors.length];

            try {
                // Bright flash
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.bluetooth.setBrightness(100);
                await this.sleep(delay / 8);

                // Rapid dim sequence (comet tail effect)
                for (let b = 80; b >= 10 && this.softwarePatternRunning; b -= 15) {
                    await this.bluetooth.setBrightness(b);
                    await this.sleep(delay / 12);
                }

                // Brief dark
                await this.bluetooth.setBrightness(5);
                await this.sleep(delay / 6);

            } catch (e) { /* ignore */ }

            colorIndex++;
            this.softwarePatternInterval = setTimeout(run, 0);
        };
        run();
    }

    // Pattern: Sparkle - random brightness flickers
    async runSoftwareSparkle(colors, delay) {
        let colorIndex = 0;
        const run = async () => {
            if (!this.softwarePatternRunning) return;

            // Occasionally change color
            if (Math.random() > 0.7) {
                colorIndex = Math.floor(Math.random() * colors.length);
            }
            const c = colors[colorIndex];

            // Random brightness for sparkle effect
            const brightness = Math.random() > 0.3
                ? Math.round(70 + Math.random() * 30)  // Bright sparkle
                : Math.round(10 + Math.random() * 30); // Dim

            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.bluetooth.setBrightness(brightness);
            } catch (e) { /* ignore */ }

            this.softwarePatternInterval = setTimeout(run, delay / 5 + Math.random() * delay / 3);
        };
        run();
    }

    // Pattern: Converge - simulates lights moving from ends to center
    // Uses brightness ramping and color cycling to create convergence illusion
    async runSoftwareConverge(colors, delay) {
        let phase = 0;
        const totalPhases = 40; // Full cycle phases

        const run = async () => {
            if (!this.softwarePatternRunning) return;

            // Split cycle into two halves:
            // First half: "ends" phase - alternating dim colors, building energy
            // Second half: "center" phase - bright peak, then release

            const cyclePos = phase % totalPhases;
            const halfCycle = totalPhases / 2;

            let brightness, colorIndex;

            if (cyclePos < halfCycle) {
                // Approaching center: brightness builds up
                const progress = cyclePos / halfCycle; // 0 to 1
                brightness = Math.round(15 + progress * 85); // 15% to 100%

                // Rapid color alternation at start, slowing to single color at peak
                const flickerRate = Math.max(1, Math.round((1 - progress) * 4));
                colorIndex = Math.floor(phase / flickerRate) % colors.length;
            } else {
                // After center peak: brightness fades quickly
                const progress = (cyclePos - halfCycle) / halfCycle; // 0 to 1
                brightness = Math.round(100 - progress * 85); // 100% down to 15%

                // Color stabilizes then starts flickering again
                const flickerRate = Math.max(1, Math.round(progress * 4));
                colorIndex = Math.floor(phase / flickerRate) % colors.length;
            }

            const c = colors[colorIndex];

            try {
                await this.bluetooth.setColor(c.r, c.g, c.b);
                await this.bluetooth.setBrightness(brightness);
            } catch (e) { /* ignore */ }

            phase++;
            this.softwarePatternInterval = setTimeout(run, delay / 12);
        };
        run();
    }

    // ==================== Custom Patterns ====================

    setupPatternControls() {
        document.getElementById('add-step').addEventListener('click', () => this.addPatternStep());
        document.getElementById('play-pattern').addEventListener('click', () => this.playPattern());
        document.getElementById('stop-pattern').addEventListener('click', () => this.stopPattern());
        document.getElementById('save-pattern').addEventListener('click', () => this.savePattern());

        // Transition duration slider
        const durationSlider = document.getElementById('transition-duration');
        const durationValue = document.getElementById('transition-duration-value');
        if (durationSlider) {
            durationSlider.addEventListener('input', () => {
                durationValue.textContent = `${durationSlider.value}ms`;
            });
        }

        // Setup initial step listeners
        this.setupStepListeners();
    }

    setupStepListeners() {
        document.querySelectorAll('.pattern-step').forEach((step, index) => {
            const colorInput = step.querySelector('.step-color-input');
            const durationInput = step.querySelector('.step-duration');
            const removeBtn = step.querySelector('.remove-step');
            const colorDisplay = step.querySelector('.step-color');

            colorInput.addEventListener('input', (e) => {
                this.patternSteps[index].color = e.target.value;
                colorDisplay.style.backgroundColor = e.target.value;
            });

            durationInput.addEventListener('input', (e) => {
                this.patternSteps[index].duration = parseInt(e.target.value) || 500;
            });

            removeBtn.addEventListener('click', () => {
                if (this.patternSteps.length > 1) {
                    this.patternSteps.splice(index, 1);
                    this.renderPatternSteps();
                }
            });
        });
    }

    addPatternStep() {
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        this.patternSteps.push({ color: randomColor, duration: 500 });
        this.renderPatternSteps();
    }

    renderPatternSteps() {
        const timeline = document.getElementById('pattern-timeline');
        timeline.innerHTML = this.patternSteps.map((step, index) => `
            <div class="pattern-step" data-index="${index}">
                <div class="step-color" style="background: ${step.color};"></div>
                <input type="color" class="step-color-input" value="${step.color}">
                <input type="number" class="step-duration" value="${step.duration}" min="100" max="5000" step="100">
                <span>ms</span>
                <button class="remove-step">&times;</button>
            </div>
        `).join('');
        this.setupStepListeners();
    }

    async playPattern() {
        if (this.patternSteps.length === 0) return;

        this.stopPattern();
        const loop = document.getElementById('pattern-loop').checked;
        const transition = document.getElementById('pattern-transition').value;

        let stepIndex = 0;
        let isFirstEver = true; // Track if this is the very first step

        const runStep = async () => {
            const step = this.patternSteps[stepIndex];
            const rgb = this.hexToRgb(step.color);

            try {
                // Apply transition for all steps except the very first one
                await this.applyTransition(rgb, transition, !isFirstEver);
                isFirstEver = false;
            } catch (error) {
                console.error('Pattern step failed:', error);
            }

            stepIndex++;
            if (stepIndex >= this.patternSteps.length) {
                if (loop) {
                    stepIndex = 0;
                    // Don't reset isFirstEver - transitions should apply on loop
                } else {
                    this.stopPattern();
                    return;
                }
            }

            this.patternInterval = setTimeout(runStep, step.duration);
        };

        runStep();
        document.getElementById('play-pattern').classList.add('active');
    }

    async applyTransition(rgb, transition, notFirst) {
        const duration = parseInt(document.getElementById('transition-duration')?.value) || 200;

        switch (transition) {
            case 'fade':
                if (notFirst) {
                    await this.fadeToColor(rgb, duration);
                } else {
                    await this.bluetooth.setColor(rgb.r, rgb.g, rgb.b);
                }
                break;

            case 'smooth':
                // Smoother fade with more steps
                if (notFirst) {
                    await this.fadeToColor(rgb, duration, 20); // More steps for smoother
                } else {
                    await this.bluetooth.setColor(rgb.r, rgb.g, rgb.b);
                }
                break;

            case 'flash':
                // Flash white briefly before color (duration controls flash length)
                const flashTime = Math.max(30, duration / 4);
                await this.bluetooth.setColor(255, 255, 255);
                await this.sleep(flashTime);
                await this.bluetooth.setColor(rgb.r, rgb.g, rgb.b);
                break;

            case 'pulse':
                // Dim down, change color, brighten up (duration controls total time)
                const pulseStep = Math.max(30, duration / 4);
                await this.bluetooth.setBrightness(20);
                await this.sleep(pulseStep);
                await this.bluetooth.setColor(rgb.r, rgb.g, rgb.b);
                await this.sleep(pulseStep);
                await this.bluetooth.setBrightness(100);
                break;

            case 'instant':
            default:
                await this.bluetooth.setColor(rgb.r, rgb.g, rgb.b);
                break;
        }
        this.currentColor = rgb;
    }

    stopPattern() {
        if (this.patternInterval) {
            clearTimeout(this.patternInterval);
            this.patternInterval = null;
        }
        document.getElementById('play-pattern').classList.remove('active');
    }

    async fadeToColor(targetRgb, duration, steps = 10) {
        const stepDuration = duration / steps;
        const startRgb = { ...this.currentColor };

        for (let i = 1; i <= steps; i++) {
            const r = Math.round(startRgb.r + (targetRgb.r - startRgb.r) * (i / steps));
            const g = Math.round(startRgb.g + (targetRgb.g - startRgb.g) * (i / steps));
            const b = Math.round(startRgb.b + (targetRgb.b - startRgb.b) * (i / steps));

            await this.bluetooth.setColor(r, g, b);
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }

        this.currentColor = targetRgb;
    }

    savePattern() {
        const name = prompt('Enter pattern name:');
        if (!name) return;

        const pattern = {
            name,
            steps: [...this.patternSteps],
            loop: document.getElementById('pattern-loop').checked,
            transition: document.getElementById('pattern-transition').value
        };

        this.savedPatterns.push(pattern);
        localStorage.setItem('lotusLampPatterns', JSON.stringify(this.savedPatterns));
        this.renderSavedPatterns();
    }

    loadPatterns() {
        try {
            return JSON.parse(localStorage.getItem('lotusLampPatterns')) || [];
        } catch {
            return [];
        }
    }

    renderSavedPatterns() {
        const list = document.getElementById('patterns-list');

        if (this.savedPatterns.length === 0) {
            list.innerHTML = '<p class="no-patterns">No saved patterns</p>';
            return;
        }

        list.innerHTML = this.savedPatterns.map((pattern, index) => `
            <div class="saved-pattern">
                <div class="pattern-preview">
                    ${pattern.steps.map(s => `<span class="preview-dot" style="background:${s.color}"></span>`).join('')}
                </div>
                <span class="pattern-name">${pattern.name}</span>
                <button class="btn btn-small load-pattern" data-index="${index}">Load</button>
                <button class="btn btn-small btn-danger delete-pattern" data-index="${index}">&times;</button>
            </div>
        `).join('');

        list.querySelectorAll('.load-pattern').forEach(btn => {
            btn.addEventListener('click', () => this.loadPattern(parseInt(btn.dataset.index)));
        });

        list.querySelectorAll('.delete-pattern').forEach(btn => {
            btn.addEventListener('click', () => this.deletePattern(parseInt(btn.dataset.index)));
        });
    }

    loadPattern(index) {
        const pattern = this.savedPatterns[index];
        this.patternSteps = [...pattern.steps];
        document.getElementById('pattern-loop').checked = pattern.loop;
        document.getElementById('pattern-transition').value = pattern.transition;
        this.renderPatternSteps();
    }

    deletePattern(index) {
        if (confirm('Delete this pattern?')) {
            this.savedPatterns.splice(index, 1);
            localStorage.setItem('lotusLampPatterns', JSON.stringify(this.savedPatterns));
            this.renderSavedPatterns();
        }
    }

    // ==================== Utility Functions ====================

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        };
        return {
            r: Math.round(f(0) * 255),
            g: Math.round(f(8) * 255),
            b: Math.round(f(4) * 255)
        };
    }

    showError(message) {
        // Simple alert for now - could be improved with toast notifications
        console.error(message);
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LotusLampApp();

    // Clear debug log button
    document.getElementById('clear-log')?.addEventListener('click', () => {
        document.getElementById('debug-log').innerHTML = '';
    });
});
