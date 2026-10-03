#!/usr/bin/env node
/**
 * load.js  –  Stream MapReduce output from HDFS into MongoDB
 * Student 3 – MongoDB + Analytics Component
 */

"use strict";

const { MongoClient } = require("mongodb");
const { spawn }       = require("child_process");
const readline        = require("readline");
const fs              = require("fs");

// ── Config ────────────────────────────────────────────────────────────────────
const MONGO_URI    = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME      = "codeforces";
const COLLECTION   = "stats";
const HDFS_OUTPUT  = "/user/hadoop/codeforces/output/part-*";

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Loading MapReduce results into MongoDB (Ultra-Fast Aggregation)");
  console.log("═══════════════════════════════════════════\n");

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log(`>> Connected to MongoDB: ${MONGO_URI}`);

  const db  = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  // Drop collection to clear old data
  await col.drop().catch(() => {});
  console.log(`>> Cleared old data from ${DB_NAME}.${COLLECTION}`);

  const cmd = fs.existsSync("/tmp/mapreduce_output.txt")
    ? "cat /tmp/mapreduce_output.txt"
    : `hdfs dfs -cat ${HDFS_OUTPUT}`;

  const child = spawn("bash", ["-c", cmd]);
  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });

  // In-memory key aggregation map: "language\tverdict" -> totalCount
  const countMap = new Map();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const language = parts[0].trim();
    const verdict  = parts[1].trim();
    const count    = parseInt(parts[2].trim(), 10);
    if (!language || !verdict || isNaN(count)) continue;

    const key = `${language}\t${verdict}`;
    countMap.set(key, (countMap.get(key) || 0) + count);
  }

  // Convert map entries into MongoDB documents
  const documents = [];
  for (const [key, totalCount] of countMap.entries()) {
    const [language, verdict] = key.split("\t");
    documents.push({ language, verdict, count: totalCount });
  }

  if (documents.length > 0) {
    await col.insertMany(documents);
    console.log(`>> Successfully inserted ${documents.length} aggregated documents into MongoDB.`);
  }

  // Create indexes for instant query performance
  await col.createIndex({ language: 1 });
  await col.createIndex({ verdict: 1 });
  console.log(">> Indexes created on fields: language, verdict");

  await client.close();
  console.log("\n✓ Load complete. Run node jobs/queries.js for analytics.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
