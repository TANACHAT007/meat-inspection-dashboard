# Meat Inspection Dashboard

Web dashboard for the beef-quality inspection station (see `../` project): current lot, per-pack results (marbling %, lean L*a*b*, surface temperature, gas trend, status), printable lot report with QR, a **validation** page (machine grade vs expert grade → accuracy, kappa, confusion matrix, threshold suggestion), 3D model with see-through mode.

Until a Firebase project is configured the site shows clearly labelled **SAMPLE data (invented, not measurements)**.

## Data (Firebase Realtime Database — you create your own project)
```
machine/status        { state, updated, lot }
lots/<lotId>          { id, name, source, started, ended }
items/<lotId>/<push>  { t, mb, L, a, b, tp, nh, st: ok|watch|alarm, conf }
```
Rules: public read, no client writes (`database.rules.json`). The host program (Python, service account) writes — **never commit the service-account key**.
Fill `src/config.js → firebaseConfig` with the web config of YOUR project.

## Develop
```
npm install && npm run dev
npm test          # validate.js + stats.js unit tests
npm run build
```
Push to `main` → GitHub Pages (`.github/workflows/deploy.yml`). `BASE` in `vite.config.js` = repository name.

Not a food-safety certificate. Grading thresholds are USER_UNVALIDATED until the Validate page has been run on real packs.
