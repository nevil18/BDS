#!/usr/bin/env node
/**
 * mapper.js  –  Hadoop Streaming mapper
 * Student 2 – MapReduce Component
 *
 * Input  : CSV rows from STDIN (HDFS split)
 * Output : TAB-separated key-value pairs
 *          key  = "language\tverdict"
 *          value= "1"
 *
 * Handles:
 *   • Quoted CSV fields (RFC 4180)
 *   • Header row (skipped when field[0] === "submission_id" or first col header)
 *   • Empty / malformed rows
 *
 * Codeforces CSV columns expected (0-indexed):
 *   0  submission_id
 *   1  contest_id
 *   2  problem_id
 *   3  author_id
 *   4  language
 *   5  verdict
 *   6  time_consumed_millis
 *   7  memory_consumed_bytes
 *   8  submitted_at
 */

"use strict";

const readline = require("readline");

// ── RFC-4180 CSV parser (handles quoted fields with embedded commas/newlines)
function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
  }
  fields.push(field.trim());
  return fields;
}

// ── Default column indices
let colLanguage = 4;
let colVerdict  = 5;

// ── Header pattern detection
const HEADER_PATTERNS = /^(submission_id|id|sub_id|handle|#)/i;
let headerParsed = false;

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", (line) => {
  if (!line.trim()) return; // skip blank lines

  const fields = parseCsvLine(line);

  // Dynamic header parsing
  if (!headerParsed) {
    headerParsed = true;
    let langIdx = fields.findIndex((f) => /^(language|programming_language|lang)$/i.test(f.trim()));
    if (langIdx === -1) {
      langIdx = fields.findIndex((f) => /^(id_of_submission_task|problem_id|handle)$/i.test(f.trim()));
    }
    const verdictIdx = fields.findIndex((f) => /^(verdict|status)$/i.test(f.trim()));
    if (langIdx !== -1) colLanguage = langIdx;
    if (verdictIdx !== -1) colVerdict = verdictIdx;
    if (HEADER_PATTERNS.test(fields[0])) return; // skip header row
  }

  const language = (fields[colLanguage] || "Unknown").trim();
  const verdict  = (fields[colVerdict]  || "Unknown").trim();

  if (!language || !verdict) return; // skip malformed rows

  // Emit: "language\tverdict\t1"
  process.stdout.write(`${language}\t${verdict}\t1\n`);
});
