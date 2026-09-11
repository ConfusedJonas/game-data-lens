# Game Data Lens

Your game history, clearly. Explore your Supercell data export in a readable dashboard—with playtime, purchases, player statistics, and account history for each game.

**[Open Game Data Lens in your browser →](https://confusedjonas.github.io/game-data-lens/)**

No installation, account, or local server needed. Your selected export is processed on your device and is never uploaded.

## Get started

1. Open the viewer using the link above.
2. Select **Choose Supercell HTML** and choose the HTML summary from your Supercell data request.
3. Explore your statistics. Use the game icons to switch games and expand the history panels to see individual sessions and purchases.

The first game in your export opens automatically. One game or several—only the games in your file appear. Refreshing or closing the page clears the imported report.

## Get your Supercell data

You need the **HTML summary from an official Supercell personal-data request**, commonly named `Summary of Your Data - Supercell.htm`. Other filenames work too. Select a `.html` or `.htm` file up to 25 MB—not a screenshot, PDF, email, or ZIP. If your download is a ZIP, extract the HTML summary first.

Request your data through the official support page for your game:

- [Clash of Clans](https://support.supercell.com/clash-of-clans/en/articles/gdpr.html)
- [Clash Royale](https://support.supercell.com/clash-royale/en/articles/gdpr.html)
- [Boom Beach](https://support.supercell.com/boom-beach/en/articles/gdpr.html)
- [Hay Day](https://support.supercell.com/hay-day/en/articles/gdpr.html)

Follow Supercell's sign-in and security checks. The report is sent to the email associated with your Supercell ID, and its download link expires after two weeks. Downloading on a computer is recommended.

You can also open **Settings → Help and Support** in-game and look for account/privacy or personal-data help. Menu wording varies; use the official pages above for current guidance. If your account is not connected to Supercell ID, contact in-game Support.

**Game Data Lens never needs your Supercell password, verification code, or login.** Keep your export private—it can contain account identifiers, IP addresses, devices, purchases, and detailed activity.

## What you can explore

- **Your games:** themed views for Clash of Clans, Clash Royale, Boom Beach, and Hay Day, with a generic view for unfamiliar games.
- **Player and account details:** identity, account status, creation date, progress, resources, and other available statistics.
- **Playtime:** recorded playtime, an estimated lifetime total where possible, and expandable session history.
- **Purchases:** spending by currency, refunds, and individual purchase records.
- **More history:** battles, devices, connected accounts, and other exported sections.
- **Readable layouts:** mobile-friendly cards and tables, keyboard navigation, and browser back/forward support.

IP addresses and connected-account identifiers are masked by default. Use **Reveal sensitive data** when needed; selecting another file resets masking. Shared Supercell ID information is collapsed by default.

Missing sections are not invented. The viewer shows what your export contains, and unfamiliar sections are preserved as readable text or tables where possible.

## Understand your totals

| Statistic | How it is calculated |
| --- | --- |
| Recorded playtime | Sum of valid, non-negative session durations included in the export. Invalid rows remain visible but are excluded from the total. |
| Estimated lifetime playtime | Average valid exported session duration × Supercell's reported lifetime session count. |
| Recorded spend | Purchases marked **Charged**, totaled separately in each original currency. |
| Refunds | Shown separately; refunded, not-charged, and cancelled entries do not count as recorded spend. |

The lifetime playtime estimate assumes the exported sessions represent your overall playing habits. It is **not a measured lifetime total**, and cannot be calculated without sufficient session data.

Exports may contain only a limited recent history—for example, 50 session rows despite thousands of lifetime sessions. Exported row counts and lifetime counts stay separate. **“Full history” means every row in your export**, not records Supercell did not include.

Currencies are not converted or combined. A `+` before another currency means that amount was spent in addition to the first. Purchase records may be incomplete; this is not an official lifetime billing statement. Source timestamps and their UTC labeling are preserved.

## Privacy

Your file is read and calculated **only in browser memory**. There are no export uploads, analytics, ads, accounts, or saved reports. The viewer does not send player names, filenames, account identifiers, sessions, or purchases to a server.

Imported HTML is treated as inert content and converted to text. Its scripts, event handlers, styles, links, and external assets are never activated. The data-viewing page blocks network connections and form submissions.

The website itself and official game icons require ordinary network requests. Icons load through a separate sandboxed loader that cannot read your report. It requests the same public catalog and four icons for everyone, regardless of their games, without cookies or referrers. If icons are unavailable, letter badges appear and the viewer still works.

**Local processing does not mean zero network traffic:** the website host and artwork services receive normal connection information, including your IP address, but not your selected export. Browser extensions with page access and compromised devices are outside the viewer's protection. Avoid sharing screenshots containing personal information.

Read the [privacy and artwork information](https://confusedjonas.github.io/game-data-lens/privacy.html) for more details.

## Prefer a downloaded copy?

**[Download Game Data Lens (.zip)](https://github.com/ConfusedJonas/game-data-lens/archive/refs/heads/main.zip)**

1. Download and fully extract the ZIP.
2. Open the extracted `game-data-lens-main` folder, then `dist`.
3. Double-click `index.html` to open it in your browser, then choose your Supercell export.

Keep the files in `dist` together. No installation or local server is required; direct-file use has been tested in Microsoft Edge. If your browser restricts local files, use the hosted viewer instead. The downloaded viewer can process exports offline; game icons use letter badges when unavailable. The downloaded copy also includes `dist/privacy.html`.

## Troubleshooting

- **File not accepted:** select the extracted HTML summary, not its ZIP or a different file format.
- **No games found:** confirm this is the personal-data summary supplied by Supercell. Export formats can change.
- **Missing statistics:** the source may not include that section or a complete lifetime history.
- **Icons missing:** artwork services may be unavailable or blocked; this does not affect your statistics.
- **Report disappeared:** refreshing or closing the page clears it by design. Select the file again.

For unexpected behavior, [report an issue](https://github.com/ConfusedJonas/game-data-lens/issues). Describe the problem without attaching your real export, private screenshots, passwords, or account identifiers.

## Unofficial project and licensing

Game Data Lens is unofficial and is not endorsed by Supercell. For more information, see [Supercell's Fan Content Policy](https://supercell.com/en/fan-content-policy/).

Game names and artwork belong to their respective owners. Official fan-kit icons are used under conditional fan-content permission, not a public-domain or unrestricted image license. No game artwork is bundled with this project. Dynamic loading does not bypass copyright.

The [MIT license](LICENSE) applies to the project's code, not third-party trademarks or artwork. See [artwork sources](ASSET_SOURCES.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
