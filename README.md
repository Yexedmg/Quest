# Quest — Income & Career Map

A mobile-friendly web app for comparing income opportunities by potential earnings, estimated hours, and earnings per hour. It also includes career storylines, side quests, life quests, and a progress journal.

The first opportunity is building websites for local businesses: **€500–€1,500 for an estimated 30 hours**, or about **€16.67–€50 per hour**, before costs and tax.

## Run locally

No build step or dependencies are required.

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. You can also open `dist/index.html` directly on a computer.

On an HTTPS host, the app supports offline caching and installation on a phone’s Home Screen.

## Checks

Requires Node.js 18 or later:

```sh
node checks/income.test.cjs
```

These dependency-free checks cover income forms, calculations, sorting, persistence, migrations, and backup compatibility. Browser layout testing has not been completed.

## Files and data

- `dist/` contains the complete deployable static app.
- `checks/` contains behavioral checks.

Progress is stored in the current browser and does not sync between devices or website addresses. Use **Journal → Export backup** before moving, then import it in the new app. Backups from earlier Open World editions remain supported.

## Saved files

Open **Journal → Your files** to save project briefs, quotes, invoices, contracts, and other documents in this browser. Download saved files later or remove them. Files stay on this device and are not included in the JSON quest progress backup. Keep separate copies of important originals. Browser site data can be cleared, which may remove saved files. Individual files can be up to 25 MB.
