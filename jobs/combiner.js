#!/usr/bin/env node
/**
 * combiner.js  –  Hadoop Streaming combiner  (runs locally on each mapper node)
 * Student 2 – MapReduce Component
 *
 * Same logic as reducer: sums counts for each (language, verdict) key.
 * Running a combiner dramatically reduces network shuffle traffic.
 *
 * Input  : sorted TAB-separated lines: "language\tverdict\t1"
 * Output : "language\tverdict\tpartialCount"
 */

"use strict";

const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

let currentKey = null;
let currentCount = 0;

function emit(key, count) {
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
