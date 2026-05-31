# 🎵 AcaraPlay - Music Player PWA

Music player profesional untuk acara, berbasis Vue 3 + Vite + PWA.

## Fitur
- 🎵 Buka folder / file audio dari storage lokal
- 🔊 Slider volume vertikal (kiri layar)
- ⏯️ Fade in/out saat play & pause (preset + custom)
- 🔀 Shuffle, Loop, Crossfade
- 📱 PWA — bisa diinstall & jalan offline
- 🎛️ Media Session API (kontrol dari lock screen)
- ⌨️ Keyboard shortcut: Space, ↑↓←→, M, F, G

## Keyboard Shortcuts
| Tombol | Fungsi |
|--------|--------|
| `Space` | Play / Pause |
| `←` `→` | Prev / Next lagu |
| `↑` `↓` | Volume naik / turun |
| `M` | Mute / Unmute |
| `F` | Fade Out (manual) |
| `G` | Fade In (manual) |

## Deploy ke GitHub Pages

1. Upload repo ini ke GitHub
2. Pergi ke **Settings → Pages**
3. Source: **GitHub Actions**
4. Push ke branch `main` → otomatis ter-deploy

## Lokal (development)

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
