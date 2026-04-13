#!/usr/bin/env node
/**
 * docs:generate — reads lib/schemas.ts and writes ARCHITECTURE.md
 *
 * Usage:  node scripts/docs-generate.mjs
 *         npm run docs:generate
 *
 * No external dependencies — only Node.js built-ins.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMAS_FILE = path.join(ROOT, "lib", "schemas.ts");
const OUTPUT_FILE = path.join(ROOT, "ARCHITECTURE.md");

// ─── Source ───────────────────────────────────────────────────────────────────

const src = fs.readFileSync(SCHEMAS_FILE, "utf8");

// ─── Balanced-paren extractor ─────────────────────────────────────────────────

function extractBalanced(text, start, open = "(", close = ")") {
  let depth = 0;
  let i = start;
  let buf = "";
  while (i < text.length) {
    const ch = text[i];
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      buf += ch;
      if (depth === 0) return buf;
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  return buf;
}

function splitComma(str) {
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of str) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(buf.trim()); buf = ""; }
    else buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

// ─── Type-expression → readable string ───────────────────────────────────────

function describeType(expr) {
  expr = expr.trim().replace(/\s+/g, " ");
  const optional = expr.endsWith(".optional()");
  const partial  = /\.partial\(\)/.test(expr);
  let base = expr.replace(/\.optional\(\)\s*$/, "").replace(/\.partial\(\)/, "").trim();
  let result = describeBase(base);
  if (partial) result = `Partial<${result}>`;
  if (optional) result += "?";
  return result;
}

function describeBase(expr) {
  expr = expr.trim();
  if (expr.startsWith("z.string(")) {
    let s = "string";
    const min = expr.match(/\.min\((\d+)\)/); if (min) s += ` ≥${min[1]} chars`;
    const max = expr.match(/\.max\((\d+)\)/); if (max) s += ` ≤${max[1]} chars`;
    if (expr.includes(".url()")) s += " (url)";
    return s;
  }
  if (expr.startsWith("z.number("))   return "number";
  if (expr.startsWith("z.boolean("))  return "boolean";
  if (expr.startsWith("z.unknown()")) return "unknown";
  if (expr === "z.null()")            return "null";
  if (expr === "z.undefined()")       return "undefined";

  if (expr.startsWith("z.literal(")) {
    const m = expr.match(/z\.literal\(("([^"]*?)"|'([^']*?)'|([^)]+))\)/);
    if (m) { const val = m[2] ?? m[3] ?? m[4]; return `\`"${val}"\``; }
    return "literal";
  }

  if (expr.startsWith("z.enum(")) {
    const m = expr.match(/z\.enum\(\[([^\]]+)\]\)/);
    if (m) return m[1].split(",").map(v => `\`${v.trim().replace(/^["']|["']$/g,"")}\``).join(" \\| ");
    return "enum";
  }

  if (expr.startsWith("z.array(")) {
    const inner = expr.slice("z.array(".length);
    let depth = 1, innerExpr = "";
    for (let i = 0; i < inner.length && depth > 0; i++) {
      const ch = inner[i];
      if (ch === "(") depth++;
      if (ch === ")") { depth--; if (depth === 0) break; }
      innerExpr += ch;
    }
    return `${describeBase(innerExpr.trim())}[]`;
  }

  if (expr.startsWith("z.record(")) {
    const inner = expr.slice("z.record(".length, -1);
    const parts = splitComma(inner);
    return parts.length >= 2
      ? `Record<${describeBase(parts[0])}, ${describeBase(parts[1])}>`
      : `Record<string, ${describeBase(parts[0])}>`;
  }

  if (expr.startsWith("z.union(")) {
    const m = expr.match(/^z\.union\(\[([\s\S]+)\]\)$/);
    if (m) return splitComma(m[1]).map(p => describeBase(p.trim())).join(" \\| ");
    return "union";
  }

  if (expr.startsWith("z.object("))   return "object";
  if (expr.startsWith("z.custom<")) {
    const m = expr.match(/z\.custom<(.+?)>\(\)/);
    return m ? `\`${m[1]}\`` : "custom";
  }
  if (expr.startsWith("z.custom("))   return "custom";

  if (/^[A-Z][A-Za-z0-9]+Schema$/.test(expr)) {
    return `[${expr}](#${expr.toLowerCase().replace(/[^a-z0-9]/g,"-")})`;
  }
  return `\`${expr}\``;
}

// ─── Section parser ───────────────────────────────────────────────────────────

function parseSections() {
  const sections = [];
  const re = /\/\/ -{5,}\r?\n\/\/ (\d+)\. (.+?)\r?\n((?:\/\/ .+\r?\n)*?)\/\/ -{5,}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const lines = m[3].split("\n")
      .map(l => l.replace(/^\/\/\s*/, "").trim()).filter(Boolean);
    sections.push({
      num: m[1],
      title: m[2].trim(),
      source: lines.filter(l => l.startsWith("Source:")).map(l => l.replace("Source:", "").trim()),
      notes:  lines.filter(l => !l.startsWith("Source:")),
      pos: m.index,
    });
  }
  return sections;
}

// ─── JSDoc extractor ──────────────────────────────────────────────────────────

function jsdocBefore(pos) {
  const before = src.slice(0, pos);
  // Match only a single JSDoc block immediately before the export (no code between them)
  const m = before.match(/\/\*\*((?:[^*]|\*(?!\/))*)\*\/[ \t]*\r?\n[ \t]*$/);
  if (!m) return "";
  return m[1].replace(/\n[ \t]*\*[ \t]?/g, " ").trim();
}

// ─── Schema extractor ─────────────────────────────────────────────────────────

function parseSchemas() {
  const schemas = [];
  // Simple regex — does NOT include JSDoc so m.index is always at "export const"
  const re = /export const ([A-Z][A-Za-z0-9]+Schema)\s*=\s*(z\.[a-z]+)\(/g;
  const found = new Map();
  let m;
  while ((m = re.exec(src)) !== null) {
    if (!found.has(m[1])) found.set(m[1], { name: m[1], kind: m[2], pos: m.index });
  }

  for (const [, entry] of found) {
    const jsdoc = jsdocBefore(entry.pos);
    const openIdx = src.indexOf("(", entry.pos);
    if (openIdx === -1) continue;
    const body = extractBalanced(src, openIdx, "(", ")");

    let schema;
    if      (entry.kind === "z.object") schema = { ...entry, jsdoc, kind: "object", fields: parseObjectFields(body) };
    else if (entry.kind === "z.enum")   schema = { ...entry, jsdoc, kind: "enum",   values: parseEnumValues(body) };
    else if (entry.kind === "z.union")  schema = { ...entry, jsdoc, kind: "union",  variants: parseUnionVariants(body) };
    else if (entry.kind === "z.record") {
      const parts = splitComma(body.slice(1, -1));
      schema = { ...entry, jsdoc, kind: "record",
        key:   parts[0] ? describeBase(parts[0].trim()) : "string",
        value: parts[1] ? describeBase(parts[1].trim()) : "unknown" };
    } else {
      schema = { ...entry, jsdoc, kind: "primitive", desc: describeBase(entry.kind + body) };
    }
    schemas.push(schema);
  }
  return schemas;
}

function parseObjectFields(body) {
  // body = "({ field: type, ... })"
  const inner = body.replace(/^\(\s*\{/, "").replace(/\}\s*\)$/, "").trim();

  const fieldStarts = [];
  let depth = 0;
  let i = 0;
  while (i < inner.length) {
    const ch = inner[i];
    if ("([{".includes(ch)) { depth++; i++; continue; }
    if (")]}".includes(ch)) { depth--; i++; continue; }
    if (depth === 0) {
      const slice = inner.slice(i);
      // Skip a JSDoc block and record it as the comment for the next field
      const jsdocMatch = slice.match(/^\/\*\*((?:[^*]|\*(?!\/))*)\*\/[ \t]*\r?\n[ \t]*/);
      if (jsdocMatch) {
        const commentText = jsdocMatch[1].replace(/\n[ \t]*\*[ \t]?/g, " ").trim();
        i += jsdocMatch[0].length;
        // Immediately check for the field name
        const fm = inner.slice(i).match(/^(\$?\w+)\s*:/);
        if (fm) {
          fieldStarts.push({ name: fm[1], start: i, comment: commentText });
          i += fm[0].length;
        }
        continue;
      }
      // Skip line comment
      const lcMatch = slice.match(/^\/\/.+(\n|$)/);
      if (lcMatch) { i += lcMatch[0].length; continue; }
      // Field name (including $-prefixed)
      const fm = slice.match(/^(\$?\w+)\s*:/);
      if (fm && (i === 0 || /[\s,]/.test(inner[i - 1]))) {
        fieldStarts.push({ name: fm[1], start: i, comment: "" });
        i += fm[0].length;
        continue;
      }
    }
    i++;
  }

  return fieldStarts.map(({ name, start, comment }, idx) => {
    const valueStart = start + name.length + 1;
    const end = idx + 1 < fieldStarts.length ? fieldStarts[idx + 1].start : inner.length;
    let rawValue = inner.slice(valueStart, end).trim()
      .replace(/\/\*\*[\s\S]*?\*\/\s*$/, "")  // strip trailing JSDoc (next field's)
      .replace(/\/\/.+$/m, "")                  // strip trailing line comment
      .replace(/,\s*$/, "").trim();

    const optional = rawValue.endsWith(".optional()");
    return { name, type: describeType(rawValue), optional, description: comment || "" };
  });
}

function parseEnumValues(body) {
  const inner = body.replace(/^\(\s*\[/, "").replace(/\]\s*\)$/, "").trim();
  return inner
    .split(",")
    .map(v => v.trim().replace(/^["']|["']$/g, ""))
    .filter(v => v.length > 0);
}

function parseUnionVariants(body) {
  const inner = body.replace(/^\(\s*\[/, "").replace(/\]\s*\)$/, "").trim();
  return splitComma(inner).map(v => describeBase(v.trim()));
}

// ─── Assign schemas to sections ───────────────────────────────────────────────

function assignToSections(sections, schemas) {
  sections.sort((a, b) => a.pos - b.pos);
  schemas.sort((a, b) => a.pos - b.pos);

  const bounds = sections.map((sec, i) => ({
    ...sec,
    end: i + 1 < sections.length ? sections[i + 1].pos : Infinity,
  }));

  const bySection = new Map(sections.map(s => [s.num, []]));
  const orphans   = [];

  for (const schema of schemas) {
    let placed = false;
    for (const sec of bounds) {
      if (schema.pos >= sec.pos && schema.pos < sec.end) {
        bySection.get(sec.num).push(schema);
        placed = true;
        break;
      }
    }
    if (!placed) orphans.push(schema);
  }
  return { bounds, bySection, orphans };
}

// ─── Markdown renderers ───────────────────────────────────────────────────────

function renderObjectTable(schema) {
  if (!schema.fields || schema.fields.length === 0)
    return "_No fields (empty object)._\n";
  const rows = schema.fields.map(({ name, type, optional, description }) =>
    `| \`${name}\` | ${type} | ${optional ? "—" : "✅"} | ${description || "—"} |`
  ).join("\n");
  return `| Field | Type | Required | Description |\n|-------|------|:--------:|-------------|\n${rows}\n`;
}

function renderSchema(schema) {
  let md = `\n### \`${schema.name}\`\n\n`;
  if (schema.jsdoc) md += `${schema.jsdoc}\n\n`;
  switch (schema.kind) {
    case "object":
      md += renderObjectTable(schema);
      break;
    case "enum":
      md += `**Values:** ${schema.values.map(v => `\`"${v}"\``).join(" \\| ")}\n`;
      break;
    case "union":
      md += `| Variant |\n|---------|\n${schema.variants.map(v => `| ${v} |`).join("\n")}\n`;
      break;
    case "record":
      md += `**Shape:** \`Record<${schema.key}, ${schema.value}>\`\n`;
      break;
    default:
      md += `**Type:** ${schema.desc ?? schema.kind}\n`;
  }
  return md;
}

function renderSection(sec, schemas) {
  let md = `\n---\n\n## ${sec.num}. ${sec.title}\n`;
  if (sec.source?.length) md += `\n> **Source:** ${sec.source.map(s => `\`${s}\``).join(", ")}\n`;
  for (const note of (sec.notes ?? [])) {
    // Only emit the blank blockquote continuation line when there was already a source line
    if (sec.source?.length || md.endsWith(">\n")) md += `>\n`;
    md += `> ${note}\n`;
  }
  for (const schema of schemas) md += renderSchema(schema);
  return md;
}

function renderToc(bounds, bySection) {
  let md = "\n## Table of Contents\n\n";
  for (const sec of bounds) {
    const anchor = `${sec.num}-${sec.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+$/,"")}`;
    const count = (bySection.get(sec.num) || []).length;
    md += `${sec.num}. [${sec.title}](#${anchor}) _(${count} schema${count !== 1 ? "s" : ""})_\n`;
  }
  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const sections = parseSections();
const schemas  = parseSchemas();
const { bounds, bySection, orphans } = assignToSections(sections, schemas);

const now = new Date().toISOString().slice(0, 10);

let md = `# web Architecture\n`;
md += `\n> Auto-generated from [\`lib/schemas.ts\`](./lib/schemas.ts).\n`;
md += `> Run \`npm run docs:generate\` to refresh after any schema change.\n`;
md += `>\n> **Last updated:** ${now}\n`;
md += renderToc(bounds, bySection);
for (const sec of bounds) md += renderSection(sec, bySection.get(sec.num) || []);
if (orphans.length) {
  md += `\n---\n\n## Additional Schemas\n`;
  for (const schema of orphans) md += renderSchema(schema);
}
md += "\n";

fs.writeFileSync(OUTPUT_FILE, md, "utf8");
console.log(`✅  Written ${OUTPUT_FILE} (${schemas.length} schemas across ${sections.length} sections)`);
