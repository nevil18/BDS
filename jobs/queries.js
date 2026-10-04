#!/usr/bin/env node
/**
 * queries.js  –  Analytical insights from MongoDB stats collection
 * Initial Q1 and Q2 queries
 */
"use strict";

const { MongoClient } = require("mongodb");

const MONGO_URI  = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME    = "codeforces";
const COLLECTION = "stats";

function printTable(title, rows, columns) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
  const header = columns.map((c) => c.label.padEnd(c.width)).join("  ");
  console.log(header);
  console.log("─".repeat(60));
  for (const row of rows) {
    const line = columns.map((c) => String(row[c.key] ?? "").padEnd(c.width)).join("  ");
    console.log(line);
  }
  console.log("─".repeat(60));
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const col = client.db(DB_NAME).collection(COLLECTION);

  // Q1. Top 10 languages by TLE
  const tleLangs = await col
    .aggregate([
      { $match: { verdict: { $regex: /time limit exceeded/i } } },
      { $group: { _id: "$language", tle_count: { $sum: "$count" } } },
      { $sort: { tle_count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, language: "$_id", tle_count: 1 } },
    ])
    .toArray();
  printTable("Q1: Top 10 Languages by Time Limit Exceeded", tleLangs, [
    { key: "language",  label: "Language",       width: 30 },
    { key: "tle_count", label: "TLE Count",      width: 12 },
  ]);

  // Q2. Top 10 languages by MLE
  const mleLangs = await col
    .aggregate([
      { $match: { verdict: { $regex: /memory limit exceeded/i } } },
      { $group: { _id: "$language", mle_count: { $sum: "$count" } } },
      { $sort: { mle_count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, language: "$_id", mle_count: 1 } },
    ])
    .toArray();
  printTable("Q2: Top 10 Languages by Memory Limit Exceeded", mleLangs, [
    { key: "language",  label: "Language",       width: 30 },
    { key: "mle_count", label: "MLE Count",      width: 12 },
  ]);

  await client.close();
}

main().catch(console.error);
