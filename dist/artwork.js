(() => {
  "use strict";
  // Isolated by sandbox="allow-scripts" (no allow-same-origin). This frame cannot
  // read the parent document or receive imported data. Always request the same
  // public catalog and all supported icons, regardless of a visitor's exported games.
  const sources = new Map([
    ["https://fankit.supercell.com/hayday", "hay-day"],
    ["https://fankit.supercell.com/boombeach", "boom-beach"],
    ["https://fankit.supercell.com/clashofclans", "clash-of-clans"],
    ["https://fankit.supercell.com/clashroyale", "clash-royale"],
    ["https://fankit.supercell.com/brawlstars", "brawl-stars"],
    ["https://fankit.supercell.com/moco", "mo-co"]
  ]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const options = { credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", signal: controller.signal };
  async function load() {
    try {
      const response = await fetch("https://fankit.supercell.com/api/hub/grid/62", options);
      if (!response.ok) throw new Error("Artwork lookup unavailable");
      const result = await response.json();
      const cards = Object.values(result.rows || {}).flatMap(row => Object.values(row.data || {}));
      const seen = new Set();
      await Promise.allSettled(cards.map(async (card) => {
        const source = card.settings?.link?.url;
        const key = sources.get(source);
        if (!key || seen.has(key) || typeof card.file_url !== "string") return;
        seen.add(key);
        const imageUrl = new URL(card.file_url);
        if (imageUrl.origin !== "https://media.ffycdn.net" || !imageUrl.pathname.startsWith("/eu/supercell/")) return;
        // Use the catalog's current image, scaled without cropping or recoloring.
        imageUrl.search = "";
        imageUrl.searchParams.set("width", "256");
        imageUrl.hash = "";
        const image = await fetch(imageUrl, options);
        if (!image.ok) return;
        const blob = await image.blob();
        if (blob.size > 2000000 || !["image/png", "image/jpeg", "image/webp"].includes(blob.type)) return;
        parent.postMessage({ type: "artwork", key, blob, source }, "*");
      }));
    } catch { /* The viewer's local letter badges remain usable if offline or blocked. */ }
    finally {
      clearTimeout(timeout);
      parent.postMessage({ type: "complete" }, "*");
    }
  }
  if (parent !== window) load();
})();
