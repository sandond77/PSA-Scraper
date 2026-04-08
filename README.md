# PSA Card Image Scraper

Downloads front and back images of the scans for cards from your PSA account orders. It can pull the initial scans or the graded scans but this can only be used for YOUR OWN SUBMISSIONS.

## Requirements

- [Node.js](https://nodejs.org) (LTS version recommended)
- A PSA account with orders you want to pull images from

## Setup & Usage

1. **Clone or download** this repository.
2. **Verify that Node.js is installed or install it via the link above. 
3. **Double-click the launcher** for your OS:
   - macOS: `PSA Scraper (macOS).command`
   - Windows: `PSA Scraper (Windows).bat`

On first run it will automatically install dependencies and download the browser (~90 MB, one time only).


### What it asks you

| Prompt        | Example                                                            |
| ------------- | ------------------------------------------------------------------ |
| PSA order URL | `https://www.psacard.com/myaccount/myorders/13490465/25504619`     |
| Cert range(s) | `127283889-127284082` or `127283889-127283900,127284000-127284010` |
| Save folder   | A native folder picker will open — navigate to or create your batch folder |

### Login

The first time you run it (or if your session expires), a browser window will open for you to log in to PSA normally, including MFA. After you log in, press Enter in the terminal — your session is saved locally so you won't need to log in again until it expires.

## Output

Images are saved to your Desktop under `PSA Scrapes/<batch name>/<CERT>/`:

```
Desktop/PSA Scrapes/<batch name>/<CERT>/<CERT>-1.jpg   ← front
Desktop/PSA Scrapes/<batch name>/<CERT>/<CERT>-2.jpg   ← back
```

## Notes

- Your saved login session (`psa-storage.json`) is gitignored and stays on your machine only
- The scraper uses a real Chromium browser — it will be visible on screen while running

## Changelog

### 2026-04-08
- **Auto-expire login session** — saved session is automatically deleted and re-prompted after 24 hours to prevent stale cookie issues
- **Fix cert matching** — updated parser to handle PSA's redesigned orders page (removed bullet point prefix from cert numbers)
- **Image area threshold lowered** — adjusted to match PSA's new image delivery sizes

### 2026-03-xx
- **Skip certs with no image** — scraper now logs a warning and continues to the next cert instead of crashing when a card has no scan
- **Run-again prompt** — after a scrape completes, prompts to run again or auto-closes in 10 seconds
- **Raw / Graded mode** — added prompt to select card type; images are saved under `<CERT>/Raw/` or `<CERT>/Graded/` so both can live in the same batch folder
- **Native folder picker** — replaced text input with a native OS folder picker (Finder on macOS, Explorer on Windows)
- **Batch name prompt** — save folder defaults to `Desktop/PSA Scrapes` with a recommended `Year Month Tier` naming format (e.g. `2026 January Value Plus`)
- **macOS & Windows launchers** — double-clickable launchers handle first-time setup automatically

### Initial Release
- Scrapes front and back raw scans from PSA order pages for your own submissions
- Session saved locally; only logs in when needed

## Roadmap

- [ ] **Graded image scraping** — pull the final graded card scans (front & back) from each cert's public PSA page, saved alongside raw scans as `<CERT>/Graded/<CERT>-1.jpg`
