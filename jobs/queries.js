#!/usr/bin/env node
/**
 * queries.js  –  Analytical insights from MongoDB stats collection
 * Q1, Q2, Q3, Q4, Q5 queries
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

  // Q3. Acceptance rate per language
  const acceptRates = await col
    .aggregate([
      {
        $group: {
          _id: "$language",
          total: { $sum: "$count" },
          accepted: {
            $sum: {
              $cond: [{ $regexMatch: { input: "$verdict", regex: /^accepted$/i } }, "$count", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          language: "$_id",
          total: 1,
          accepted: 1,
          acceptance_rate: {
            $concat: [
              { $toString: { $round: [{ $multiply: [{ $divide: ["$accepted", "$total"] }, 100] }, 1] } },
              "%",
            ],
          },
        },
      },
      { $match: { total: { $gte: 50 } } },
      { $sort: { accepted: -1 } },
      { $limit: 15 },
    ])
    .toArray();
  printTable("Q3: Acceptance Rate per Language (min 50 submissions)", acceptRates, [
    { key: "language",        label: "Language",         width: 30 },
    { key: "total",           label: "Total",            width: 10 },
    { key: "accepted",        label: "Accepted",         width: 10 },
    { key: "acceptance_rate", label: "Accept Rate",      width: 12 },
  ]);

  // Q4. Total submissions per language
  const totalPerLang = await col
    .aggregate([
      { $group: { _id: "$language", total: { $sum: "$count" } } },
      { $sort: { total: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, language: "$_id", total: 1 } },
    ])
    .toArray();
  printTable("Q4: Total Submissions per Language (Top 15)", totalPerLang, [
    { key: "language", label: "Language",  width: 30 },
    { key: "total",    label: "Total",     width: 12 },
  ]);

  // Q5. Most common verdict overall
  const verdictCounts = await col
    .aggregate([
      { $group: { _id: "$verdict", total: { $sum: "$count" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, verdict: "$_id", total: 1 } },
    ])
    .toArray();
  printTable("Q5: Most Common Verdicts (Top 10)", verdictCounts, [
    { key: "verdict", label: "Verdict",  width: 35 },
    { key: "total",   label: "Count",    width: 12 },
  ]);

  await client.close();
}

main().catch(console.error);
