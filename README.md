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

## Roadmap

- [ ] **Graded image scraping** — pull the final graded card scans (front & back) from each cert's public PSA page, saved alongside raw scans as `<CERT>/Graded/<CERT>-1.jpg`
