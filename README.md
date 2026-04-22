# LunaSync

> Her energy forecast, mapped to the moon. Know the vibe before you walk in.

A private PWA that forecasts mood/energy by mapping a 29-day cycle to moon phases. All data stays on-device. No server, no accounts, no tracking.

---



## Install on iPhone (Required for notifications)

1. Open Safari on your iPhone
2. Go to your GitHub Pages URL
3. Tap the **Share button** (box with arrow)
4. Tap **"Add to Home Screen"**
5. Name it `LunaSync` → tap **Add**

Now open it from your home screen icon (not from Safari browser — this matters).

---

## Notifications on iPhone

### What works ✅
- **iOS 16.4+**: Web Push is supported for installed PWAs
- Open the app from your home screen icon → go to **Settings → enable Phase-Change Alerts**
- iOS will show a native permission prompt — tap **Allow**
- You'll get notified when energy phases shift (every few days, not daily)

### What doesn't work ❌
- **Notifications won't fire if the app is fully closed AND the phone hasn't opened it in days**
- iOS suspends PWA service workers after extended inactivity

### Practical workaround 🧠
The app reschedules notifications **every time you open it**. So:
- Open LunaSync once every few days (30 seconds) to keep it alive
- The notification will fire the morning of the next phase change

### Best practice
Set a recurring iOS Shortcut or Focus reminder to "check LunaSync" every Sunday — that's enough to keep scheduling active for the whole week.

---

## How tracking works

> This is NOT moon-mysticism. It's calendar math.

Tracking is based on **day counting from cycle start** — the most reliable non-biometric method. The moon phase names are a visual metaphor: a typical cycle (~29 days) happens to mirror the lunar month.

Data is stored in `localStorage` — it lives on your device under the hosted URL. Uninstalling the app or clearing browser data will wipe it.

---

## Files

```
lunasync/
├── index.html        ← Entire app (self-contained, all CSS + JS inlined)
├── manifest.json     ← PWA config (name, icons, standalone mode)
├── service-worker.js ← Offline caching + notification delivery
└── icons/            ← App icons (192px, 512px)
```
