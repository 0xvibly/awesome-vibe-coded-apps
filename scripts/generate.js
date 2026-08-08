#!/usr/bin/env node
/**
 * Regenerates README.md from the live vibeking.fun directory.
 *
 * Data source: GET https://vibeking.fun/api/products?limit=all — the public,
 * no-key endpoint that returns the directory as structured JSON.
 * (The site's /api/list endpoint returns pre-rendered HTML fragments,
 * so the structured /api/products dump is used instead.)
 *
 * NOTE: /api/products is paginated and returns 500 rows by default, so the
 * `limit=all` parameter is load-bearing — without it this list silently
 * shrinks to 500 products. The completeness assertion below is the guard.
 *
 * API docs: https://vibeking.fun/api
 *
 * No dependencies. Node 18+ (global fetch).
 * Run: node scripts/generate.js
 */

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://vibeking.fun/api/products?limit=all";
const OUT_FILE = path.join(__dirname, "..", "README.md");
const TOP_PER_CATEGORY = 15;
const MIN_CATEGORY_SIZE = 3;

// The live data contains a few near-duplicate category labels.
// Merge them for presentation only; product data is untouched.
const CATEGORY_ALIASES = {
  other: "Other",
  "Developer Tools": "Dev Tools",
};

function canonicalCategory(raw) {
  const c = (raw || "").trim() || "Other";
  return CATEGORY_ALIASES[c] || c;
}

function anchor(name) {
  // GitHub heading anchor: lowercase, spaces -> dashes, strip non-word chars.
  return name
    .toLowerCase()
    .replace(/[^\w\- ]+/g, "")
    .replace(/ /g, "-");
}

function escapeMd(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/([\\`*_[\]<>|])/g, "\\$1")
    .trim();
}

function tagline(p) {
  let t = escapeMd(p.tagline);
  if (t.length > 160) t = t.slice(0, 157).trimEnd() + "…";
  if (t && !/[.!?…]$/.test(t)) t += ".";
  return t;
}

function productLine(p) {
  const name = escapeMd(p.name);
  const site = (p.url || "").trim();
  const listing = `https://vibeking.fun/product/${p.id}`;
  const link = site ? `[${name}](${site})` : `[${name}](${listing})`;
  return `- ${link} — ${tagline(p)} ▲ ${p.upvotes} · [VibeKing](${listing})`;
}

async function main() {
  const res = await fetch(API_URL, {
    headers: { "user-agent": "awesome-vibe-coded-apps generator (github.com/0xvibly/awesome-vibe-coded-apps)" },
  });
  if (!res.ok) throw new Error(`API returned HTTP ${res.status}`);
  const body = await res.json();
  if (!body.success || !Array.isArray(body.data)) {
    throw new Error("Unexpected API response shape");
  }
  const products = body.data;

  // Fail loudly rather than quietly publishing a truncated list. `total` is the
  // whole directory; if we did not receive all of it, something changed upstream.
  if (typeof body.total === "number" && products.length < body.total) {
    throw new Error(
      `Incomplete dump: received ${products.length} of ${body.total} products. ` +
        "Check that ?limit=all is still supported by /api/products."
    );
  }
  const liveness = body.liveness || null;

  // Group by (merged) category.
  const byCategory = new Map();
  for (const p of products) {
    const cat = canonicalCategory(p.category);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(p);
  }

  // Categories ordered by size desc, then name; tiny buckets fold into Other.
  const folded = new Map();
  for (const [cat, list] of byCategory) {
    if (cat !== "Other" && list.length < MIN_CATEGORY_SIZE) {
      const other = folded.get("Other") || [];
      folded.set("Other", other.concat(list));
    } else {
      folded.set(cat, (folded.get(cat) || []).concat(list));
    }
  }
  const categories = [...folded.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );

  const today = new Date().toISOString().slice(0, 10);
  const lines = [];

  const livenessLine = liveness
    ? `Every listed URL is re-probed on a schedule, and the source API publishes the result: **${liveness.live.toLocaleString("en-US")} confirmed live**, ${liveness.at_risk.toLocaleString("en-US")} at risk, ${liveness.dead.toLocaleString("en-US")} dead, ${liveness.unchecked.toLocaleString("en-US")} not yet checked. Most directories never tell you how much of their index has rotted.`
    : "";

  lines.push(
    "# Awesome Vibe-Coded Apps [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)",
    "",
    "> A curated list of vibe-coded apps — real products built with AI coding tools.",
    "",
    "### ➜ Full searchable directory: **[vibeking.fun](https://vibeking.fun)**",
    "",
    `This README is a daily snapshot. The live directory has search, category filters, upvoting, maker profiles and every one of the ${products.length.toLocaleString("en-US")} products — this file only shows the top ${TOP_PER_CATEGORY} per category.`,
    "",
    "| | |",
    "|---|---|",
    "| 🌐 **Browse everything** | [vibeking.fun](https://vibeking.fun) |",
    "| 🏆 **Current ranking** | [vibeking.fun/best](https://vibeking.fun/best) |",
    "| 🔌 **Free API (no key)** | [vibeking.fun/api](https://vibeking.fun/api) · [docs repo](https://github.com/0xvibly/vibeking-api) |",
    "| 🚀 **Add your app** | [vibeking.fun/submit](https://vibeking.fun/submit) — free |",
    "",
    "## How this list is built",
    "",
    `This file is **regenerated every day by [GitHub Actions](.github/workflows/update.yml)**, straight from the live [vibeking.fun](https://vibeking.fun) directory via its free public API (\`GET /api/products\`, no key, CORS enabled — see [the docs](https://vibeking.fun/api) or the [vibeking-api](https://github.com/0xvibly/vibeking-api) repo). Nothing here is hand-curated, so it never goes stale: **${products.length.toLocaleString("en-US")} products** across **${categories.length} categories**, each section showing the top ${TOP_PER_CATEGORY} by community upvotes. Last updated ${today}.`,
    ...(livenessLine ? ["", livenessLine] : []),
    "",
    "## Contents",
    ""
  );

  for (const [cat, list] of categories) {
    lines.push(`- [${cat}](#${anchor(cat)}) (${list.length})`);
  }
  lines.push("- [Contributing](#contributing)", "");

  for (const [cat, list] of categories) {
    const top = [...list]
      .sort((a, b) => b.upvotes - a.upvotes || a.id - b.id)
      .slice(0, TOP_PER_CATEGORY);
    lines.push(`## ${cat}`, "");
    for (const p of top) lines.push(productLine(p));
    if (list.length > TOP_PER_CATEGORY) {
      lines.push(
        "",
        `*…and ${list.length - TOP_PER_CATEGORY} more in [${escapeMd(cat)} on VibeKing](https://vibeking.fun/best).*`
      );
    }
    lines.push("");
  }

  lines.push(
    "## Contributing",
    "",
    "This list is generated from live data — see [CONTRIBUTING.md](./CONTRIBUTING.md). Pull requests that edit README.md directly are overwritten by the next daily run; submit the product to the directory instead and it flows through automatically.",
    "",
    "**Built a vibe-coded app?** Submit it → [vibeking.fun/submit](https://vibeking.fun/submit) — free listing, community upvotes, and an embeddable badge. Put that badge on your own site and your listing's outbound link becomes a followed link ([Verified Makers](https://vibeking.fun/verified)). Once approved, your product appears here on the next daily run.",
    "",
    "## Related",
    "",
    "- **[vibeking.fun](https://vibeking.fun)** — the live, searchable directory this list is generated from",
    "- **[vibeking.fun/api](https://vibeking.fun/api)** — the free, no-key API behind it",
    "- **[0xvibly/vibeking-api](https://github.com/0xvibly/vibeking-api)** — API reference, badge docs, and runnable example clients",
    "",
    "## License",
    "",
    "[CC0 1.0](./LICENSE) — public domain. Product names and taglines belong to their makers.",
    ""
  );

  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
  console.log(
    `Wrote ${path.relative(process.cwd(), OUT_FILE)}: ${products.length} products, ${categories.length} categories.`
  );
}

main().catch((err) => {
  console.error("Generation failed:", err.message);
  process.exit(1);
});
