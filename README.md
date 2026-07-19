# StyleMate

**Your AI-powered personal wardrobe & outfit assistant.** Digitize the clothes
you already own, then get complete, weather-aware outfit suggestions for any
occasion — built only from your own wardrobe.

StyleMate is a self-contained, installable **PWA** (Progressive Web App). It runs
on iOS and Android home screens as well as the desktop, works fully offline, and
keeps **all data — including every photo — on your device**. Nothing is ever
uploaded to a server. The single exception is the free
[Open-Meteo](https://open-meteo.com) weather API, used only if you opt to share
your location for weather-tuned suggestions.

👉 Live app: served from the `docs/` folder (GitHub Pages).

## Features

### 👗 Digital wardrobe
- Add a photo of any item — upper wear, bottoms, footwear or accessories.
- **Colour is auto-detected on-device** from the photo (canvas analysis); you can
  tag category, type, style, pattern, fabric and season, and add personal notes
  like *"slightly tight"* or *"special occasions only"*.
- Browse by category with instant search and style filters.

### ✨ Outfit suggestions
- Pick an occasion (office, wedding, date, gym, interview, festival, party…) and
  get **2–3 complete looks** (top + bottom + footwear + accessories).
- The engine factors in **live weather** (temperature & rain), time of day,
  occasion formality, **colour-coordination rules**, and **what you wore recently**
  (to avoid repeats).
- Looks are shown as a **collage of your actual item photos**. Shuffle a whole
  look, swap an individual piece, mark *Wear today*, or save to favorites.
- Outfit history and favorites are tracked automatically.

### 🎨 Personal style profile
- Upload a selfie and StyleMate estimates your **skin undertone** (warm / cool /
  neutral) — **processed entirely on-device; the photo is never stored**.
- Get a **recommended colour palette** and **fit tips** for your body type.
- **Smart shopping suggestions** perform a gap analysis of your wardrobe and
  recommend specific items/colours to buy (e.g. *"You lack formal footwear; dark
  brown loafers would suit your warm undertone"*), with a shop link.

### Extras
- 🧳 **Packing assistant** — enter a destination and trip length, get outfits and a
  checklist.
- 🧺 **Laundry tracker** — mark items as *in wash* to exclude them from suggestions.
- 🔔 **Morning suggestion** toggle, 🌙 **dark/light theme**, °C/°F units.

## Privacy
- Everything lives locally in **IndexedDB** (photos) and **localStorage**
  (metadata). No account, no server, no tracking.
- **Export** a JSON backup of your metadata, or **Delete all data** with one tap.

## Tech
- Single self-contained `docs/index.html` — no build step, no dependencies.
- Vanilla JS SPA, IndexedDB for image blobs, Canvas API for colour & undertone
  analysis, Geolocation + Open-Meteo for weather, Service Worker for offline use.

## Run locally
It's a static site — serve the `docs/` folder with any static server:

```bash
cd docs
python3 -m http.server 8080
# open http://localhost:8080
```

Then use *Add to Home Screen* on mobile to install it as an app.
