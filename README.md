# Quest — Income & Career Map

A mobile-friendly career app for comparing income opportunities, tracking career paths, and recording progress on work-related quests.

The first income opportunity is building websites for local businesses: **€500–€1,500 for an estimated 30 hours**, or about **€16.67–€50 per hour**, before costs and tax.

## Run locally

No build step or dependencies are required.

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. On an HTTPS host, the app supports offline caching and installation on a phone’s Home Screen.

## Save and import your data

Quest saves progress automatically in the current browser. Open **Journal** and choose **Save data file** to download a JSON file containing income opportunities, career paths, quests, completed steps, and journal history. On another device, open Quest, choose **Import data file**, and select the JSON file. Import replaces the data currently in Quest, so save a copy first if you want to keep both. Earlier Open World and QUEST//LOG backups remain supported; personal life quests are removed during import.

## Files

- `dist/` contains the static app for local hosting.
- `checks/` contains dependency-free app checks.
