#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  run_all.sh  –  All-in-One HDFS + YARN + MapReduce + MongoDB Pipeline
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Load Hadoop paths if not already in environment
export HADOOP_HOME="${HADOOP_HOME:-/home/hadoopuser/hadoop}"
export PATH="$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin"

echo "============================================================"
echo "  Codeforces Submissions Analysis Pipeline"
echo "  S3 Stream -> HDFS & YARN MapReduce -> MongoDB -> Queries"
echo "============================================================"
echo ""

# ── Step 0: Ensure HDFS & YARN Daemons are Running ──────────────────────────────
echo ">> Checking Hadoop Services (jps)..."
if ! jps 2>/dev/null | grep -q "NameNode"; then
  echo "   [+] Starting HDFS (start-dfs.sh)..."
  start-dfs.sh || true
else
  echo "   [✓] HDFS is running."
fi

if ! jps 2>/dev/null | grep -q "ResourceManager"; then
  echo "   [+] Starting YARN (start-yarn.sh)..."
  start-yarn.sh || true
else
  echo "   [✓] YARN is running."
fi

echo ""
# ── Step 1: Run MapReduce job on HDFS & YARN ──────────────────────────────────
echo ">> Step 1/3: Running MapReduce Job on HDFS and YARN..."
bash jobs/run_job.sh --rerun

echo ""
# ── Step 2: Load results into local MongoDB ────────────────────────────────────
echo ">> Step 2/3: Loading MapReduce results into MongoDB (mongodb://127.0.0.1:27017)..."
node jobs/load.js

echo ""
# ── Step 3: Run analytical queries ─────────────────────────────────────────────
echo ">> Step 3/3: Running Analytical Queries..."
node jobs/queries.js

echo ""
echo "============================================================"
echo "  ✓ Pipeline completed successfully!"
echo "  Data is stored in HDFS and MongoDB (codeforces.stats)"
echo "============================================================"
