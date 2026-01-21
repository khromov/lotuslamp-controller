# LotusLamp Controller

A web-based Bluetooth controller for LotusLamp X, ELK-BLEDOM, and similar generic BLE RGB LED strip controllers.

## Features

- **Web Bluetooth API** - Connect directly from your browser (Chrome, Edge, Opera)
- **Color Control** - Color wheel, RGB sliders, and preset colors
- **Brightness Control** - Adjustable brightness with live preview
- **Software Patterns** - 13 custom color patterns animated via rapid BLE commands:
  - Cycle, Fade, Pulse, Strobe, Breathe, Flash, Smooth, Random, Wave, Bounce, Comet, Sparkle, Converge
- **Built-in Device Effects** - Access firmware modes 0-255
- **Mode Explorer** - Scan and discover hidden device effects
- **Custom Patterns** - Create your own color sequences with configurable transitions
- **Favorites** - Save your favorite modes for quick access
- **Pattern Persistence** - Saved patterns stored in localStorage

## Supported Devices

Works with BLE LED controllers that use the common `0xFFF0`/`0xFFE0` service UUIDs, including:
- LotusLamp X
- ELK-BLEDOM / ELK-BLEDOB
- MELK series
- Many generic "Magic LED" and "LED BLE" controllers

## Usage

1. Open `index.html` in a Web Bluetooth-compatible browser
2. Click "Connect via Bluetooth"
3. Select your LED device from the browser's device picker
4. Control your lights!

Or serve it locally:
```bash
npx serve
```

## Browser Support

- Chrome (Desktop & Android)
- Edge
- Opera

Note: Safari and Firefox do not support Web Bluetooth API.

## Protocol

Uses standard ELK-BLEDOM command format:
- Header: `0x7E`
- Footer: `0xEF`
- Color: `7E 07 05 03 [R] [G] [B] 10 EF`
- Brightness: `7E 04 01 [level] 01 FF 02 01 EF`
- Effect: `7E 07 03 [mode] 03 FF FF 00 EF`
- Speed: `7E 07 02 [speed] FF FF FF 00 EF`

## License

MIT
