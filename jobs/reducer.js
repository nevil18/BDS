#!/usr/bin/env node
/**
 * reducer.js  –  Hadoop Streaming reducer
 * Student 2 – MapReduce Component
 *
 * Input  : sorted TAB-separated lines: "language\tverdict\tcount"
 *          (Hadoop guarantees lines with the same key arrive consecutively)
 * Output : "language\tverdict\ttotalCount"
 *
 * The output is written to HDFS and later ingested into MongoDB by load.js
 */

"use strict";

const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

let currentKey   = null;
let currentCount = 0;

function emit(key, count) {
  // Final output format: language TAB verdict TAB count
  process.stdout.write(`${key}\t${count}\n`);
}

rl.on("line", (line) => {
  if (!line.trim()) return;

  const parts = line.split("\t");
  if (parts.length < 3) return;

  const language = parts[0];
  const verdict  = parts[1];
  const count    = parseInt(parts[2], 10) || 0;
  const key      = `${language}\t${verdict}`;

  if (key === currentKey) {
    currentCount += count;
  } else {
    if (currentKey !== null) emit(currentKey, currentCount);
    currentKey   = key;
    currentCount = count;
  }
});

rl.on("close", () => {
  if (currentKey !== null) emit(currentKey, currentCount);
});
