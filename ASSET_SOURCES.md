# Artwork sources

No game artwork is bundled. Local fallback badges consist only of letters.

App icons are resolved automatically from [Supercell's official fan kit](https://fankit.supercell.com/), using its public catalog at `https://fankit.supercell.com/api/hub/grid/62`:

- [Hay Day](https://fankit.supercell.com/hayday)
- [Boom Beach](https://fankit.supercell.com/boombeach)
- [Clash of Clans](https://fankit.supercell.com/clashofclans)
- [Clash Royale](https://fankit.supercell.com/clashroyale)
- [Brawl Stars](https://fankit.supercell.com/brawlstars)
- [mo.co](https://fankit.supercell.com/moco)

The catalog supplies the app-icon URLs; image URLs are not hardcoded. Only raster images from `https://media.ffycdn.net/eu/supercell/` are accepted, at a requested width of 256px. Cards are matched by their fixed official fan-kit links. Remote HTML content is never executed or inserted. If the public catalog changes, icons fall back to local letter badges.

These are copyrighted app icons, available under [Supercell's conditional Fan Content Policy](https://supercell.com/en/fan-content-policy/), not public-domain or unrestricted open-license images. The app uses them to identify supported games, with a visible unofficial notice and policy link. It does not claim individual written approval or transfer image rights through its code license. Images are displayed without recoloring or cropping. Checked September 12, 2026.
