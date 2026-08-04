#!/usr/bin/env node
/**
 * Regenerates README.md from the live vibeking.fun directory.
 *
 * Data source: GET https://vibeking.fun/api/products — the public, no-key
 * endpoint that returns the full directory as structured JSON.
 * (The site's /api/list endpoint returns pre-rendered HTML fragments,
 * so the structured /api/products dump is used instead.)
 *
 * No dependencies. Node 18+ (global fetch).
 * Run: node scripts/generate.js
 */

const fs = require("node:fs");
const path = require("node:path");

const API_URL = "https://vibeking.fun/api/products";
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

  lines.push(
    "# Awesome Vibe-Coded Apps [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)",
    "",
    "> A curated list of vibe-coded apps — real products built with AI coding tools.",
    "",
    `Auto-generated daily from the live [vibeking.fun](https://vibeking.fun) directory. Currently tracking **${products.length.toLocaleString("en-US")} products** across **${categories.length} categories**. Each section lists the top ${TOP_PER_CATEGORY} by community upvotes. Last updated ${today}.`,
    "",
    "Browse the full ranking at [vibeking.fun/best](https://vibeking.fun/best) · [Submit your app](https://vibeking.fun/submit) (free, dofollow backlink)",
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
    "This list is generated from live data — see [CONTRIBUTING.md](./CONTRIBUTING.md).",
    "",
    "**Built a vibe-coded app?** Submit it → [vibeking.fun/submit](https://vibeking.fun/submit) — free listing, community upvotes, dofollow backlink, and an embeddable badge. Once approved it appears here automatically.",
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
