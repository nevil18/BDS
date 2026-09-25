#!/usr/bin/env node
/**
 * load.js – Stream MapReduce output from HDFS into MongoDB
 * Student 3 – MongoDB & Analytics Component
 */
"use strict";

const { MongoClient } = require("mongodb");
const { spawn } = require("child_process");
const readline = require("readline");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "codeforces";
const COLLECTION = "stats";

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  await col.drop().catch(() => {});

  const child = spawn("bash", ["-c", "cat /tmp/mapreduce_output.txt"]);
  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });

  const docs = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    docs.push({ language: parts[0].trim(), verdict: parts[1].trim(), count: parseInt(parts[2].trim(), 10) });
  }

  if (docs.length > 0) {
    await col.insertMany(docs);
    console.log(`>> Inserted ${docs.length} documents into MongoDB.`);
  }
  await client.close();
}

main().catch(console.error);
