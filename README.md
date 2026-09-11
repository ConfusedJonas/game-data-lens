# Game Data Lens

A free, independent browser viewer for Supercell personal-data exports. Explore your games, recorded and estimated playtime, purchases, and account history without uploading your export.

**Private review:** this repository is private, and GitHub Pages is not enabled. There is no publicly hosted website yet. A browser-only public link can be added after the owner approves publication. A private repository does **not** automatically make a Pages website private.

## Open the viewer locally

After starting the local server, [open Game Data Lens in your browser](http://127.0.0.1:4173/).

1. Obtain this project on your computer. Local serving requires Python 3; the website itself has no build step or package dependencies.
2. On Windows, double-click `start-local.cmd`. Alternatively, run the following command from the project directory on Windows, macOS, or Linux (use `python3` if your system requires it):

   ```sh
   python -m http.server 4173 --bind 127.0.0.1 --directory dist
   ```

3. Open the local link above and choose your Supercell `.html` or `.htm` export. File selection reads the file on your device; it does not upload it.
4. Select a game icon to switch games. Expand the history panels to see all rows included in the export. Refreshing or closing the page clears the imported report.

Stop the server with Ctrl+C or close its command window. It binds only to your own computer, not your local network. If port 4173 is already occupied, stop the earlier server or use another port in both the command and browser address.

Once a public static site is approved and deployed, visitors will be able to use its link directly without downloading this project, installing Python, or creating an account. Export processing will still stay in each visitor's browser.

## Which file do I need?

Use the **HTML summary from an official Supercell personal-data request**, commonly named `Summary of Your Data - Supercell.htm`. The filename can differ; its contents must contain game sections. Files up to 25 MB are accepted.

Download the report supplied by Supercell. If it arrives in a ZIP archive, extract it and select the HTML summary, not the ZIP, an email, a screenshot, or a PDF. Keep the original export private: it may contain account identifiers, IP addresses, purchase records, devices, and detailed activity.

### Request your data from Supercell

Use the official request page for your game:

- [Clash of Clans — Request Your Personal Data](https://support.supercell.com/clash-of-clans/en/articles/gdpr.html)
- [Clash Royale — Request Your Personal Data](https://support.supercell.com/clash-royale/en/articles/gdpr.html)
- [Boom Beach — Request Your Personal Data](https://support.supercell.com/boom-beach/en/articles/gdpr.html)
- [Hay Day — Request Your Personal Data](https://support.supercell.com/hay-day/en/articles/gdpr.html)

Follow the official page's Supercell ID sign-in and security checks. Supercell sends the report to the email address associated with your Supercell ID; its download link expires after two weeks. Downloading on a computer is recommended. If the account is not connected to Supercell ID, contact in-game Support. These requirements are explained on the linked official request pages and may change.

To reach Support in-game, open the game's **Settings → Help and Support**, then look for account/privacy or personal-data help and follow the available contact/request options. Menu wording varies by game and version; the official pages above are the reference. This viewer cannot request data for you and never needs your password, verification code, or Supercell ID login.

## What you can view

- Distinct themes for Boom Beach, Clash of Clans, Clash Royale, and Hay Day, plus a fallback for unknown games.
- Any number of exported games in their original order; the first opens automatically. Multiple games have hash-based navigation with browser back/forward support.
- Player identity, account details, progress, resources, devices, battles, and other exported sections when available. Shared Supercell ID details are collapsed by default.
- IP addresses and connected-account identifiers masked by default, with an explicit reveal control. Loading another file resets revealing.
- Expandable session and purchase histories, readable tables, keyboard navigation, and responsive layouts.

No sessions, purchases, or optional sections are invented when an export omits them. Unfamiliar sections are displayed as text/cards or tables where possible. Supercell export formats can change; check unusual results against the original file.

## What the totals mean

- **Recorded playtime:** the sum of valid, non-negative session durations actually included in the export. Malformed or negative durations are excluded from the sum but their rows remain visible with a warning.
- **Estimated lifetime playtime:** average duration of valid exported sessions × Supercell's reported lifetime session count. This is an extrapolation, not a measured total. Recent exported sessions may not represent older playing habits. No estimate is shown without sufficient data.
- **Session counts:** exported rows and Supercell's lifetime session count are separate. For example, an export can list only 50 sessions even if the account has thousands of lifetime sessions. “Full history” means every row in the export, not unavailable lifetime records.
- **Recorded spend:** charged purchases summed separately by original currency. A `+` between currencies means both amounts were spent, not that a currency conversion was performed. Refunded amounts are shown separately; refunded, not-charged, and cancelled entries do not count as recorded spend.
- **Timestamps:** source timestamps and their UTC labeling are preserved, not silently converted to the viewer's local time zone.

Purchase history may also be incomplete. This viewer is not an official lifetime billing statement or a currency-conversion tool.

## Privacy and security

The selected export is parsed and calculated **only in browser memory**. No export uploads, backend, analytics, accounts, API keys, persistent report storage, or browser-agent integrations are used. Imported HTML is parsed in a detached, inert template and converted to text; its scripts, handlers, links, styles, and assets are never activated. The data-viewing page's Content Security Policy blocks network connections and form submissions.

App icons load automatically through a separate sandboxed frame. It fetches the same public Supercell fan-kit catalog and four icons for everyone, regardless of the imported games. It has no access to the report or the viewer's document. Requests omit credentials and referrers; artwork services still receive normal connection information. Unknown game names and report contents are never sent to those services. When artwork is unavailable, local letter badges remain and the viewer still works. No game artwork is bundled in this repository.

This is **local data processing**, not a promise of zero network traffic: the browser retrieves the website's static files and the isolated public artwork. If hosted later, the website host also receives normal page requests. See [Privacy & artwork](dist/privacy.html) for details. A compromised device, a browser extension with page access, or a malicious future code change is outside the app's protection. Do not share screenshots showing private data.

## Publication after private review

The included Pages workflow is **manual-only** and skips deployment unless both conditions hold:

1. The repository is public.
2. The repository Actions variable `PUBLIC_SITE_APPROVED` is set to `true`.

Both gates intentionally prevent this private review repository from being deployed. Making the source public is a separate, deliberate decision: inspect all tracked files and history first, never include real exports, and obtain the owner's approval.

After approval, configure repository **Settings → Pages → Source: GitHub Actions**, satisfy the two gates, then run **Publish public website (approval required)** from Actions. The workflow validates JavaScript and publishes only `dist/`. Use the resulting deployment URL as the README's direct-use link. No build service, database, secrets, or API tokens are required by the website.

[GitHub's private Pages access control](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) requires an Enterprise Cloud organization; an ordinary personal private repository is not private website hosting. Keep using localhost during private review.

## Development and safe contributions

The application uses plain HTML, CSS, and JavaScript. `dist/` is the complete static website, not generated build output. `tests/` contains synthetic import fixtures, including an intentionally hostile HTML fixture: select it through the viewer to check inert parsing; do not open it directly as a website.

Optional syntax checks require Node.js:

```sh
node --check dist/app.js
node --check dist/artwork.js
```

Before publishing changes, check synthetic one-game/three-game imports, missing sections, multiple currencies, invalid durations, keyboard/mobile layouts, and offline artwork fallback. Use browser network inspection to confirm selecting a report makes no report-related requests. Do not add tracking or automatic export uploads.

Never commit real exports, account details, tokens, passwords, `.env` files, or real-data screenshots. Ignore rules are a safety net, not a substitute for reviewing `git diff --cached` and the complete tracked-file list. Local tool metadata and diagnostic files are not part of this project.

## Rights

Game Data Lens is unofficial and is not endorsed by Supercell. See [Supercell's Fan Content Policy](https://supercell.com/en/fan-content-policy/). The official fan-kit icons are used under conditional fan-content permission, not an unrestricted open license. Dynamic loading does not bypass copyright, and no individual written approval is claimed. Game names and images belong to their respective owners; the interface links to official artwork sources.

The [MIT license](LICENSE) covers this project's code, not third-party trademarks or artwork. See [artwork sources](ASSET_SOURCES.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Review the applicable policies before deploying a modified version.
