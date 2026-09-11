(() => {
  "use strict";

  const app = document.querySelector("#app");
  const uploadMarkup = app.innerHTML;

  const GAME_THEMES = {
    "boom-beach": { aliases: ["boombeach"] },
    "clash-of-clans": { aliases: ["clashofclans", "clashclans", "coc"] },
    "clash-royale": { aliases: ["clashroyale", "clashroyal"] },
    "hay-day": { aliases: ["hayday"] },
    "brawl-stars": { aliases: ["brawlstars", "brawlstar"] },
    "mo-co": { aliases: ["moco"] }
  };

  const state = { report: null, fileName: "", activeGameId: "", revealSensitive: false };
  const artwork = new Map();
  let artworkFrame = null;
  let artworkTimer = null;
  let statsResizeObserver = null;
  const unofficialNotice = `<p class="legal-notice">Game Data Lens is unofficial and is not endorsed by Supercell. <a href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noopener noreferrer">Supercell’s Fan Content Policy</a>. Game names and artwork belong to their respective owners. <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Privacy & artwork</a></p>`;
  const compactText = (value = "") => value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function slugify(value) {
    return compactText(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game";
  }

  function themeKeyFor(name) {
    const normalized = compactText(name).toLowerCase().replace(/[^a-z0-9]/g, "");
    return Object.entries(GAME_THEMES).find(([, theme]) => theme.aliases.includes(normalized))?.[0] || "generic";
  }

  function gameIcon(game, decorative = false) {
    const initials = compactText(game.name).split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
    const item = artwork.get(game.themeKey);
    const content = item
      ? `<img src="${escapeHtml(item.url)}" alt="" class="wiki-artwork">`
      : `<span class="generic-game-icon">${escapeHtml(initials || "G")}</span>`;
    return `<span class="game-image" data-game-icon="${escapeHtml(game.themeKey)}"${decorative ? ' aria-hidden="true"' : ` role="img" aria-label="${escapeHtml(game.name)}"`}>${content}</span>`;
  }

  function updateArtworkUi() {
    app.querySelectorAll("[data-game-icon]").forEach((slot) => {
      const item = artwork.get(slot.dataset.gameIcon);
      if (!item) return;
      const image = document.createElement("img");
      image.src = item.url;
      image.alt = "";
      image.className = "wiki-artwork";
      slot.replaceChildren(image);
    });
    const credits = app.querySelector(".artwork-credits");
    if (credits) credits.innerHTML = [...artwork.entries()].map(([key, item]) => `<a href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(key.replaceAll("-", " "))} icon</a>`).join(" · ");
  }

  function loadArtwork() {
    if (artworkFrame || state.report) return;
    // This isolated document only knows a fixed public game list. No export data is sent.
    artworkFrame = document.createElement("iframe");
    artworkFrame.hidden = true;
    artworkFrame.title = "Official app icon loader";
    artworkFrame.setAttribute("sandbox", "allow-scripts");
    artworkFrame.referrerPolicy = "no-referrer";
    artworkFrame.src = "./artwork.html";
    document.body.append(artworkFrame);
    artworkTimer = setTimeout(finishArtwork, 20000);
    updateArtworkUi();
  }

  function finishArtwork() {
    clearTimeout(artworkTimer);
    artworkFrame?.remove();
    artworkFrame = null;
    updateArtworkUi();
  }

  window.addEventListener("message", (event) => {
    if (!artworkFrame || event.source !== artworkFrame.contentWindow || event.origin !== "null") return;
    const message = event.data;
    if (message?.type === "artwork" && Object.hasOwn(GAME_THEMES, message.key) &&
        message.blob instanceof Blob && message.blob.size <= 2000000 &&
        ["image/png", "image/jpeg", "image/webp"].includes(message.blob.type) &&
        typeof message.source === "string" && /^https:\/\/fankit\.supercell\.com\/(hayday|boombeach|clashofclans|clashroyale|brawlstars|moco)$/.test(message.source)) {
      const previous = artwork.get(message.key);
      if (previous) URL.revokeObjectURL(previous.url);
      artwork.set(message.key, { url: URL.createObjectURL(message.blob), source: message.source });
      updateArtworkUi();
    } else if (message?.type === "complete") {
      finishArtwork();
    }
  });

  function parseTable(tableElement) {
    const headerCells = [...tableElement.querySelectorAll("thead th")];
    const fallbackHeaderRow = tableElement.querySelector("tr");
    const headers = (headerCells.length ? headerCells : [...(fallbackHeaderRow?.querySelectorAll("th") || [])])
      .map((cell) => compactText(cell.textContent));
    const rows = [...tableElement.querySelectorAll("tr")]
      .filter((row) => row.querySelectorAll("td").length)
      .map((row) => ({ values: [...row.querySelectorAll("td")].map((cell) => compactText(cell.textContent)) }));
    return { headers, rows };
  }

  function parseSection(title, nodes) {
    const paragraphs = [];
    const items = [];
    const tables = [];
    nodes.forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      if (tag === "p") {
        const text = compactText(node.textContent);
        if (text) paragraphs.push(text);
      } else if (tag === "ul" || tag === "ol") {
        [...node.querySelectorAll(":scope > li")].forEach((li) => {
          const text = compactText(li.textContent);
          if (text) items.push(text);
        });
      } else if (tag === "table") {
        tables.push(parseTable(node));
      }
    });
    return { title, paragraphs, items, tables };
  }

  function parseDuration(rawValue) {
    const value = compactText(rawValue).toLowerCase();
    if (!value || /(^|\s)-\d/.test(value)) return null;
    if (/^\d+(?::\d{1,2}){1,3}$/.test(value)) {
      const parts = value.split(":").map(Number).reverse();
      const multipliers = [1, 60, 3600, 86400];
      return parts.reduce((total, part, index) => total + part * multipliers[index], 0);
    }
    const units = {
      d: 86400, day: 86400, days: 86400,
      h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600,
      m: 60, min: 60, mins: 60, minute: 60, minutes: 60,
      s: 1, sec: 1, secs: 1, second: 1, seconds: 1
    };
    const regex = /(\d+(?:[.,]\d+)?)\s*(days?|d|hours?|hrs?|hr|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/gi;
    let total = 0;
    let matches = 0;
    let match;
    while ((match = regex.exec(value)) !== null) {
      total += Number(match[1].replace(",", ".")) * units[match[2].toLowerCase()];
      matches += 1;
    }
    return matches ? Math.round(total) : null;
  }

  function parsePrice(rawValue) {
    const value = compactText(rawValue).toUpperCase();
    const currency = value.match(/\b[A-Z]{3}\b/)?.[0];
    const numeric = value.match(/[-+]?\d[\d\s.,']*/)?.[0];
    if (!currency || !numeric) return { amount: null, currency: currency || null };
    let normalized = numeric.replace(/[\s']/g, "");
    const comma = normalized.lastIndexOf(",");
    const dot = normalized.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? "," : ".";
      normalized = normalized.replace(decimal === "," ? /\./g : /,/g, "").replace(decimal, ".");
    } else if (comma >= 0 || dot >= 0) {
      const separator = comma >= 0 ? "," : ".";
      const parts = normalized.split(separator);
      const finalPart = parts.at(-1);
      if (parts.length === 2 && finalPart.length <= 2) normalized = `${parts[0]}.${finalPart}`;
      else if (parts.length > 2 && finalPart.length <= 2) normalized = `${parts.slice(0, -1).join("")}.${finalPart}`;
      else normalized = parts.join("");
    }
    const amount = Number(normalized);
    return { amount: Number.isFinite(amount) && amount >= 0 ? amount : null, currency };
  }

  function getTableByHeaders(section, expectedHeaders, allowFallback = false) {
    const match = section?.tables.find((table) => {
      const headers = table.headers.map((header) => header.toLowerCase());
      return expectedHeaders.every((expected) => headers.some((header) => header.includes(expected)));
    });
    return match || (allowFallback ? section?.tables[0] : null) || null;
  }

  function normalizeSessions(section) {
    const table = getTableByHeaders(section, ["duration"], true);
    if (!table) return { table: null, rows: [], totalSeconds: 0, validCount: 0, invalidCount: 0 };
    const durationIndex = table.headers.findIndex((header) => header.toLowerCase().includes("duration"));
    const rows = table.rows.map((row) => {
      const durationText = row.values[durationIndex] || "";
      return { ...row, durationText, durationSeconds: parseDuration(durationText) };
    });
    const validRows = rows.filter((row) => row.durationSeconds !== null);
    return {
      table, rows,
      totalSeconds: validRows.reduce((sum, row) => sum + row.durationSeconds, 0),
      validCount: validRows.length,
      invalidCount: rows.length - validRows.length
    };
  }

  function normalizePurchases(section) {
    const table = getTableByHeaders(section, ["price", "status"], true);
    if (!table) return { table: null, rows: [], invalidPriceCount: 0 };
    const priceIndex = table.headers.findIndex((header) => header.toLowerCase().includes("price"));
    const statusIndex = table.headers.findIndex((header) => header.toLowerCase().includes("status"));
    let invalidPriceCount = 0;
    const rows = table.rows.map((row) => {
      const priceText = row.values[priceIndex] || "";
      const parsedPrice = parsePrice(priceText);
      if (parsedPrice.amount === null) invalidPriceCount += 1;
      return { ...row, priceText, status: row.values[statusIndex] || "", ...parsedPrice };
    });
    return { table, rows, invalidPriceCount };
  }

  function findLifetimeSessions(items) {
    for (const item of items) {
      const match = item.match(/played\s+([\d\s.,]+)\s+sessions?\s+in\s+total/i);
      if (match) return Number(match[1].replace(/[^\d]/g, ""));
    }
    return null;
  }

  function findPlayerName(items) {
    for (const item of items) {
      const match = item.match(/^player name is\s+(.+?)[.]?$/i);
      if (match) return compactText(match[1]);
    }
    return "Player";
  }

  function parseGame(heading, takenIds) {
    const name = compactText(heading.textContent);
    const nodes = [];
    let cursor = heading.nextElementSibling;
    while (cursor && cursor.tagName?.toLowerCase() !== "h3" && cursor.tagName?.toLowerCase() !== "footer") {
      nodes.push(cursor);
      cursor = cursor.nextElementSibling;
    }
    const overviewNodes = [];
    const rawSections = [];
    let currentSection = null;
    nodes.forEach((node) => {
      if (node.tagName?.toLowerCase() === "h4") {
        if (currentSection) rawSections.push(currentSection);
        currentSection = { title: compactText(node.textContent), nodes: [] };
      } else if (currentSection) currentSection.nodes.push(node);
      else overviewNodes.push(node);
    });
    if (currentSection) rawSections.push(currentSection);
    const overview = parseSection("Player profile", overviewNodes);
    const sections = rawSections.map((section) => parseSection(section.title, section.nodes));
    const sessionsSection = sections.find((section) => section.title.toLowerCase() === "sessions") ||
      sections.find((section) => getTableByHeaders(section, ["session start", "duration"]));
    const purchasesSection = sections.find((section) => section.title.toLowerCase() === "purchases") ||
      sections.find((section) => getTableByHeaders(section, ["price", "status"]));
    const baseId = slugify(name);
    let id = baseId;
    let duplicate = 2;
    while (takenIds.has(id)) id = `${baseId}-${duplicate++}`;
    takenIds.add(id);
    return {
      id, name,
      playerName: findPlayerName(overview.items),
      themeKey: themeKeyFor(name),
      overview, sections, sessionsSection, purchasesSection,
      sessions: normalizeSessions(sessionsSection),
      purchases: normalizePurchases(purchasesSection),
      lifetimeSessions: findLifetimeSessions(overview.items)
    };
  }

  function parseSupercellExport(source) {
    // Template contents are inert: no scripts execute and no resources load.
    // Never attach imported nodes to the live document; only extract plain text.
    const template = document.createElement("template");
    template.innerHTML = source;
    template.content.querySelectorAll("script,style,noscript,iframe,object,embed,svg,math,canvas,link,meta,base,img,audio,video,source,track,template").forEach((node) => node.remove());
    const root = template.content.querySelector(".content") || template.content;
    const headings = [...root.querySelectorAll("h3")].filter((heading) => compactText(heading.textContent));
    if (!headings.length) throw new Error("No game sections were found. Choose the HTML summary supplied by Supercell.");
    const firstHeading = headings[0];
    const introNodes = [];
    let cursor = root.firstElementChild;
    while (cursor && cursor !== firstHeading) {
      introNodes.push(cursor);
      cursor = cursor.nextElementSibling;
    }
    const introText = compactText(introNodes.map((node) => node.textContent).join(" "));
    const accountHeading = introNodes.find((node) => node.tagName?.toLowerCase() === "h2");
    const accountItems = introNodes.flatMap((node) => {
      if (!["ul", "ol"].includes(node.tagName?.toLowerCase())) return [];
      return [...node.querySelectorAll(":scope > li")].map((li) => compactText(li.textContent)).filter(Boolean);
    });
    const dateMatch = introText.match(/report has been created on\s+(.+?)(?:\.|$)/i);
    const takenIds = new Set();
    return {
      title: compactText(root.querySelector("h1")?.textContent) || "Summary of Your Data",
      accountTitle: compactText(accountHeading?.textContent) || "Supercell ID",
      accountItems,
      createdAt: dateMatch?.[1] || "Date not included",
      games: headings.map((heading) => parseGame(heading, takenIds))
    };
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const pieces = [];
    if (days) pieces.push(`${days}d`);
    if (hours || days) pieces.push(`${hours}h`);
    if (minutes || hours || days) pieces.push(`${minutes}m`);
    if (!pieces.length || (days === 0 && hours === 0)) pieces.push(`${remainingSeconds}s`);
    return pieces.join(" ");
  }

  const formatCount = (value) => Number.isFinite(value) ? new Intl.NumberFormat().format(value) : "—";

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  function summarizePurchases(purchases) {
    const charged = new Map();
    const refunded = new Map();
    let chargedCount = 0;
    let refundedCount = 0;
    let excludedCount = 0;
    purchases.rows.forEach((row) => {
      const status = compactText(row.status).toLowerCase();
      const target = status.includes("refund") ? refunded : status === "charged" ? charged : null;
      if (!target) { excludedCount += 1; return; }
      if (row.amount === null || !row.currency) return;
      target.set(row.currency, Math.round(((target.get(row.currency) || 0) + row.amount) * 100) / 100);
      if (target === charged) chargedCount += 1;
      if (target === refunded) refundedCount += 1;
    });
    return { charged, refunded, chargedCount, refundedCount, excludedCount };
  }

  function estimateLifetimePlaytime(game) {
    if (!game.sessions.validCount || !Number.isFinite(game.lifetimeSessions)) return null;
    const averageSeconds = game.sessions.totalSeconds / game.sessions.validCount;
    return { averageSeconds, estimatedSeconds: Math.round(averageSeconds * game.lifetimeSessions) };
  }

  function maskIp(value) {
    if (state.revealSensitive) return value;
    return value.replace(/\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g, "$1.$2.•••.•••");
  }

  function maskIdentifier(value) {
    if (state.revealSensitive) return value;
    const colon = value.indexOf(":");
    if (colon < 0) return maskIp(value);
    const label = value.slice(0, colon + 1);
    const identifier = compactText(value.slice(colon + 1));
    if (identifier.length <= 5) return `${label} ••••`;
    return `${label} ${identifier.slice(0, 3)}••••${identifier.slice(-3)}`;
  }

  function displayText(value, context = "") {
    let output = maskIp(value);
    if (!state.revealSensitive && /social|connected account/i.test(context)) output = maskIdentifier(output);
    return output;
  }

  function factIcon(text) {
    if (/created/i.test(text)) return "◆";
    if (/last logged|last seen/i.test(text)) return "◷";
    if (/banned|locked/i.test(text)) return "✓";
    if (/clan|task force|neighborhood/i.test(text)) return "♟";
    return "•";
  }

  function renderItems(items, context = "") {
    if (!items.length) return "";
    return `<ul class="data-list">${items.map((item) => `<li><span class="list-glyph" aria-hidden="true">${factIcon(item)}</span><span>${escapeHtml(displayText(item, context))}</span></li>`).join("")}</ul>`;
  }

  const renderParagraphs = (paragraphs, context = "") => paragraphs
    .map((paragraph) => `<p>${escapeHtml(displayText(paragraph, context))}</p>`).join("");

  function renderTable(table, sectionTitle = "") {
    if (!table || !table.rows.length) return `<p class="empty-copy">No rows were included in this export.</p>`;
    const headers = table.headers.length ? table.headers : table.rows[0].values.map((_, index) => `Column ${index + 1}`);
    const statusIndex = headers.findIndex((header) => /status|result/i.test(header));
    return `<div class="table-scroll" tabindex="0" aria-label="${escapeHtml(sectionTitle)} table"><table><thead><tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.values.map((value, index) => {
      const shown = displayText(value, `${sectionTitle} ${headers[index] || ""}`);
      const statusClass = index === statusIndex ? `status status-${slugify(value)}` : "";
      return `<td data-label="${escapeHtml(headers[index] || `Column ${index + 1}`)}"><span class="${statusClass}">${escapeHtml(shown)}</span></td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderSection(section) {
    const tableCount = section.tables.reduce((count, table) => count + table.rows.length, 0);
    if (!section.items.length && !section.paragraphs.length && !section.tables.length) return "";
    const wide = section.tables.length || section.items.length > 5;
    return `<section class="content-card${wide ? " content-card-wide" : ""}"><div class="section-heading"><div><span class="section-kicker">ARCHIVE SECTION</span><h2>${escapeHtml(section.title)}</h2></div>${tableCount ? `<span class="count-chip">${formatCount(tableCount)} rows</span>` : ""}</div>${renderParagraphs(section.paragraphs, section.title)}${renderItems(section.items, section.title)}${section.tables.map((table) => renderTable(table, section.title)).join("")}</section>`;
  }

  function renderMoneyLines(map) {
    if (!map.size) return `<span class="money-empty">No charged purchases</span>`;
    return [...map.entries()].map(([currency, amount], index) => {
      const number = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
      return `<span class="money-line" role="group" aria-label="${index ? 'Plus ' : ''}${escapeHtml(number)} ${escapeHtml(currency)}"><span class="money-sign" aria-hidden="true">${index ? "+" : ""}</span><span class="money-currency" aria-hidden="true">${escapeHtml(currency)}</span><span class="money-amount" aria-hidden="true">${escapeHtml(number)}</span></span>`;
    }).join("");
  }

  function renderOverviewHighlights(game) {
    const fields = [
      { label: "Player age", pattern: /^player age\b/i },
      { label: "Account creation", pattern: /\b(?:account|village|base|farm)\b.*\bcreated\b/i },
      { label: "Account status", pattern: /\b(?:banned|locked)\b/i },
      { label: "Last login", pattern: /\blast (?:logged in|login)\b/i }
    ];
    return `<ul class="hero-facts" aria-label="Account details">${fields.map(({ label, pattern }) => {
      const value = game.overview.items.filter((item) => pattern.test(item)).join(" ");
      return `<li><span class="fact-label">${label}</span><span class="fact-value${value ? "" : " empty-copy"}">${value ? escapeHtml(displayText(value, "Player profile")) : "Not included in export"}</span></li>`;
    }).join("")}</ul>`;
  }

  function renderStats(game) {
    const spending = summarizePurchases(game.purchases);
    const estimate = estimateLifetimePlaytime(game);
    const sessionSub = game.sessions.rows.length ? `${game.sessions.validCount} valid · ${game.sessions.rows.length} exported` : "No session history included";
    const spendSub = game.purchases.rows.length ? `${formatCount(spending.chargedCount)} charged · ${formatCount(game.purchases.rows.length)} rows` : "No purchase history included";
    const playtimeValue = game.sessions.rows.length ? formatDuration(game.sessions.totalSeconds) : "Not included";
    const playtimeCard = game.sessions.rows.length
      ? `<button type="button" class="stat-card stat-card-interactive" data-expand="sessions"><span class="stat-label">Recorded playtime</span><strong class="stat-value">${playtimeValue}</strong><span class="stat-meta">${sessionSub}</span><span class="stat-action">View exported history <b aria-hidden="true">↓</b></span></button>`
      : `<div class="stat-card"><span class="stat-label">Recorded playtime</span><strong class="stat-value stat-value-small">${playtimeValue}</strong><span class="stat-meta">${sessionSub}</span></div>`;
    const spendCard = game.purchases.rows.length
      ? `<button type="button" class="stat-card stat-card-interactive" data-expand="purchases"><span class="stat-label">Recorded spend</span><strong class="stat-value stat-money">${renderMoneyLines(spending.charged)}</strong><span class="stat-meta">${spendSub}</span><span class="stat-action">View purchase history <b aria-hidden="true">↓</b></span></button>`
      : `<div class="stat-card"><span class="stat-label">Recorded spend</span><strong class="stat-value stat-value-small">Not included</strong><span class="stat-meta">${spendSub}</span></div>`;
    const estimateCard = estimate
      ? `<div class="stat-card stat-card-estimate"><span class="stat-label">Estimated lifetime playtime</span><strong class="stat-value">${formatDuration(estimate.estimatedSeconds)}</strong><span class="stat-meta">${formatDuration(estimate.averageSeconds)} average × ${formatCount(game.lifetimeSessions)} sessions</span><span class="estimate-badge">ESTIMATE</span></div>`
      : `<div class="stat-card stat-card-estimate"><span class="stat-label">Estimated lifetime playtime</span><strong class="stat-value stat-value-small">Not enough data</strong><span class="stat-meta">Recorded sessions are needed to estimate</span><span class="estimate-badge">ESTIMATE</span></div>`;
    return `<section class="stats-grid" aria-label="Game summary">${playtimeCard}${estimateCard}<div class="stat-card"><span class="stat-label">Lifetime sessions</span><strong class="stat-value">${formatCount(game.lifetimeSessions)}</strong><span class="stat-meta">Reported by Supercell</span></div>${spendCard}<div class="stat-card"><span class="stat-label">Purchase outcomes</span><strong class="stat-value">${formatCount(game.purchases.rows.length)}</strong><span class="stat-meta">${spending.refundedCount ? `${spending.refundedCount} refunded · ` : ""}${spending.excludedCount} excluded from spend</span></div></section>`;
  }

  function fitStatNumbers() {
    // Preserve full values: shrink only when needed, never wrap or truncate digits.
    const groups = [...app.querySelectorAll('.stat-value:not(.stat-value-small):not(.stat-money)')].map(value => [value]);
    app.querySelectorAll('.stat-money').forEach(money => groups.push([...money.querySelectorAll('.money-amount')]));
    groups.flat().forEach(value => value.style.removeProperty('font-size'));
    groups.forEach(values => {
      const scale = Math.min(1, ...values.map(value => value.clientWidth > 0 ? value.clientWidth / Math.max(value.clientWidth, value.scrollWidth) : 1));
      if (scale < 1) values.forEach(value => {
        value.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(value).fontSize) * scale * .98 * 100) / 100}px`;
      });
    });
  }

  function observeStatSizes() {
    statsResizeObserver?.disconnect();
    fitStatNumbers();
    if (typeof ResizeObserver !== 'function') return;
    let previousWidth = '';
    statsResizeObserver = new ResizeObserver(() => {
      const card = app.querySelector('.stat-card');
      const signature = `${card?.clientWidth}:${getComputedStyle(document.documentElement).fontSize}`;
      if (signature === previousWidth) return;
      previousWidth = signature;
      fitStatNumbers();
    });
    const grid = app.querySelector('.stats-grid');
    if (grid) statsResizeObserver.observe(grid);
  }

  function renderWarnings(game) {
    const warnings = [];
    if (game.sessions.invalidCount) warnings.push(`${game.sessions.invalidCount} session ${game.sessions.invalidCount === 1 ? "duration was" : "durations were"} invalid and excluded from recorded playtime.`);
    if (game.purchases.invalidPriceCount) warnings.push(`${game.purchases.invalidPriceCount} purchase ${game.purchases.invalidPriceCount === 1 ? "price was" : "prices were"} unreadable and excluded from spending totals.`);
    if (game.sessions.rows.length && game.lifetimeSessions && game.lifetimeSessions > game.sessions.rows.length) warnings.push(`Playtime covers the ${game.sessions.rows.length} exported session rows, not all ${formatCount(game.lifetimeSessions)} lifetime sessions.`);
    if (estimateLifetimePlaytime(game)) warnings.push("Estimated lifetime playtime assumes the exported sessions are representative of all lifetime sessions.");
    if (!warnings.length) return "";
    return `<aside class="data-warning"><span aria-hidden="true">!</span><div><strong>About these totals</strong>${warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("")}</div></aside>`;
  }

  function renderHistory(game, type) {
    const isSessions = type === "sessions";
    const section = isSessions ? game.sessionsSection : game.purchasesSection;
    const normalized = isSessions ? game.sessions : game.purchases;
    if (!section || !normalized.table) return "";
    const spending = isSessions ? null : summarizePurchases(game.purchases);
    const subtitle = isSessions ? `${normalized.rows.length} rows · ${formatDuration(normalized.totalSeconds)} of valid recorded playtime` : `${normalized.rows.length} rows · charged amounts stay grouped by currency`;
    const refundHtml = !isSessions && spending.refunded.size ? `<div class="refund-note"><strong>Refunded:</strong> ${[...spending.refunded.entries()].map(([currency, amount]) => escapeHtml(formatMoney(amount, currency))).join(" · ")}</div>` : "";
    return `<details class="history-panel" data-history="${type}"><summary><span class="history-summary-icon" aria-hidden="true">${isSessions ? "◷" : "¤"}</span><span><strong>Full exported ${isSessions ? "session" : "purchase"} history</strong><small>${subtitle}</small></span><span class="summary-chevron" aria-hidden="true">⌄</span></summary><div class="history-body">${renderParagraphs(section.paragraphs, section.title)}${refundHtml}${renderTable(normalized.table, section.title)}</div></details>`;
  }

  function renderAccountPanel(report) {
    return `<details class="account-panel"><summary><span><small>ACCOUNT OVERVIEW</small><strong>${escapeHtml(report.accountTitle)}</strong></span><span class="summary-chevron" aria-hidden="true">⌄</span></summary><div class="account-body">${report.accountItems.length ? renderItems(report.accountItems, "Account overview") : `<p class="empty-copy">No account-wide details were included.</p>`}</div></details>`;
  }

  function renderGameNavigation(report, activeGame) {
    if (report.games.length <= 1) return "";
    return `<nav class="game-nav" aria-label="Choose a game">${report.games.map((game) => `<a class="game-nav-link${game.id === activeGame.id ? " active" : ""}" href="#game=${encodeURIComponent(game.id)}" ${game.id === activeGame.id ? 'aria-current="page"' : ""}>${gameIcon(game, true)}<span>${escapeHtml(game.name)}</span></a>`).join("")}</nav>`;
  }

  function renderDashboard() {
    const report = state.report;
    const game = report?.games.find((candidate) => candidate.id === state.activeGameId) || report?.games[0];
    if (!report || !game) { showUpload("Choose a Supercell HTML file to begin."); return; }
    state.activeGameId = game.id;
    document.body.dataset.theme = game.themeKey;
    document.title = `${game.name} · Game Data Lens`;
    const genericSections = game.sections.filter((section) => section !== game.sessionsSection && section !== game.purchasesSection);
    app.innerHTML = `<div class="dashboard-shell">
      <header class="topbar"><a class="mini-brand" href="#" data-start-over aria-label="Return to file selection"><span class="lens-mark" aria-hidden="true">◉</span><span>Game Data Lens</span></a><div class="topbar-actions"><span class="file-name" title="${escapeHtml(state.fileName)}">${escapeHtml(state.fileName)}</span><button type="button" class="quiet-button" id="privacy-toggle" aria-pressed="${state.revealSensitive}">${state.revealSensitive ? "Hide sensitive data" : "Reveal sensitive data"}</button><label class="quiet-button file-change" for="file-input-dashboard">Change file</label><input id="file-input-dashboard" class="visually-hidden" type="file" accept=".html,.htm,text/html"></div></header>
      ${renderGameNavigation(report, game)}
      <section class="game-hero"><div class="hero-icon">${gameIcon(game, true)}</div><div class="hero-copy"><span class="hero-kicker">${escapeHtml(game.name.toUpperCase())} ARCHIVE</span><h1>${escapeHtml(game.playerName)}</h1><p>${escapeHtml(report.createdAt)}</p></div><div class="hero-emblem" aria-hidden="true">${game.themeKey === "generic" ? "DATA" : game.name.split(" ").map((word) => word[0]).join("")}</div></section>
      ${renderOverviewHighlights(game)}
      ${renderStats(game)}${renderWarnings(game)}${renderAccountPanel(report)}
      <div class="content-grid">${renderSection(game.overview)}${genericSections.map(renderSection).join("")}</div>
      <section class="history-stack" aria-label="Detailed histories">${renderHistory(game, "sessions")}${renderHistory(game, "purchases")}</section>
      <footer class="dashboard-footer"><span>Your selected export is processed locally and is not uploaded.</span><button type="button" data-start-over>Close archive</button></footer>
      ${unofficialNotice}<p class="artwork-credits"></p>
    </div>`;
    bindDashboardEvents();
    observeStatSizes();
    updateArtworkUi();
  }

  function getHashGameId() {
    return new URLSearchParams(window.location.hash.slice(1)).get("game") || "";
  }

  function setGame(gameId, replace = false) {
    const game = state.report?.games.find((candidate) => candidate.id === gameId);
    if (!game) throw new Error(`Unknown game id: ${gameId}`);
    state.activeGameId = game.id;
    const nextHash = `#game=${encodeURIComponent(game.id)}`;
    if (replace) history.replaceState(null, "", nextHash);
    else if (window.location.hash !== nextHash) window.location.hash = nextHash;
    renderDashboard();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return game;
  }

  async function handleFile(file, statusElement) {
    if (!file) return;
    const validExtension = /\.html?$/i.test(file.name);
    if (!validExtension && file.type !== "text/html") {
      statusElement.textContent = "That file does not look like HTML. Choose the .html or .htm file from Supercell.";
      return;
    }
    statusElement.textContent = `Reading ${file.name}…`;
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("This file exceeds the 25 MB limit. Choose the HTML summary from your data request.");
      const source = await file.text();
      if (!/<html\b|<!doctype\s+html/i.test(source)) throw new Error("This file does not contain an HTML document.");
      const report = parseSupercellExport(source);
      state.report = report;
      state.fileName = file.name;
      state.revealSensitive = false;
      const initialGame = report.games[0];
      state.activeGameId = initialGame.id;
      history.replaceState(null, "", `#game=${encodeURIComponent(initialGame.id)}`);
      renderDashboard();
    } catch (error) {
      statusElement.textContent = error instanceof Error ? error.message : "The file could not be read.";
    }
  }

  function bindPicker(input, statusElement) {
    input?.addEventListener("change", () => handleFile(input.files?.[0], statusElement));
  }

  function showUpload(message = "") {
    statsResizeObserver?.disconnect();
    state.report = null;
    state.fileName = "";
    state.activeGameId = "";
    state.revealSensitive = false;
    document.body.dataset.theme = "neutral";
    document.title = "Game Data Lens";
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    app.innerHTML = uploadMarkup;
    const input = app.querySelector("#file-input");
    const status = app.querySelector("#file-status");
    status.textContent = message;
    bindPicker(input, status);
    updateArtworkUi();
  }

  function bindDashboardEvents() {
    const fileInput = app.querySelector("#file-input-dashboard");
    bindPicker(fileInput, { set textContent(value) {
      const label = app.querySelector(".file-name");
      if (label) label.textContent = value;
    }});
    app.querySelector("#privacy-toggle")?.addEventListener("click", () => {
      state.revealSensitive = !state.revealSensitive;
      renderDashboard();
      app.querySelector("#privacy-toggle")?.focus();
    });
    app.querySelectorAll("[data-start-over]").forEach((button) => button.addEventListener("click", (event) => {
      event.preventDefault();
      showUpload();
    }));
    app.querySelectorAll("[data-expand]").forEach((button) => button.addEventListener("click", () => {
      const panel = app.querySelector(`[data-history="${button.dataset.expand}"]`);
      if (!panel) return;
      panel.open = true;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
      panel.querySelector("summary")?.focus({ preventScroll: true });
    }));
  }

  window.addEventListener("hashchange", () => {
    if (!state.report) return;
    const game = state.report.games.find((candidate) => candidate.id === getHashGameId());
    if (game && game.id !== state.activeGameId) {
      state.activeGameId = game.id;
      renderDashboard();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  window.addEventListener('resize', fitStatNumbers);
  bindPicker(document.querySelector("#file-input"), document.querySelector("#file-status"));
  loadArtwork();
})();
