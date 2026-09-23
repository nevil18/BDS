#!/usr/bin/env node
/**
 * mapper.js – Hadoop Streaming mapper
 * Student 2 – MapReduce Component
 */
"use strict";

const readline = require("readline");

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"'; i++;
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

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", (line) => {
  if (!line.trim()) return;
  const fields = parseCsvLine(line);
  if (fields.length < 6) return;
  const language = (fields[4] || "Unknown").trim();
  const verdict  = (fields[5] || "Unknown").trim();
  if (!language || !verdict) return;
  process.stdout.write(`${language}\t${verdict}\t1\n`);
});
