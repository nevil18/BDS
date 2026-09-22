#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  hdfs_setup.sh  –  Create HDFS directories and ingest the CSV locally
#  Student 1 – Cluster & HDFS Ingestion Component
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CSV_LOCAL="${PROJECT_ROOT}/data/submissions.csv"
HDFS_BASE="/user/hadoop/codeforces"

echo "══════════════════════════════════════════════"
echo "  HDFS Setup & CSV Ingestion"
echo "══════════════════════════════════════════════"

# ── Step 1: Check CSV source (S3 Direct Stream or Local CSV) ─────────────────────
echo ""
echo ">> [1/4] Checking CSV source..."
S3_URI="s3://bigdata1234567890/submissions_2million.csv"

if [ -f "$CSV_LOCAL" ]; then
  ROWS=$(wc -l < "$CSV_LOCAL")
  SIZE=$(du -sh "$CSV_LOCAL" | cut -f1)
  echo "   Local File : $CSV_LOCAL"
  echo "   Rows : $ROWS"
  echo "   Size : $SIZE"
else
  echo "   Using S3 Stream (No local clone): $S3_URI"
fi

# ── Step 2: Check HDFS availability ─────────────────────────────────────────
HDFS_BIN=$(which hdfs 2>/dev/null || true)
if [ -z "$HDFS_BIN" ]; then
  echo ""
  echo "ERROR: HDFS binary not found in PATH."
  echo "Please start HDFS first (start-dfs.sh) or add Hadoop bin to PATH."
  exit 1
fi

# ── Step 3: Create HDFS directory structure ───────────────────────────────────
echo ""
echo ">> [2/4] Creating HDFS directory structure..."
hdfs dfs -mkdir -p "$HDFS_BASE/input"
hdfs dfs -mkdir -p "$HDFS_BASE/output_backup"
hdfs dfs -ls /user/hadoop/ 2>/dev/null || true

# ── Step 4: Upload CSV to HDFS ────────────────────────────────────────────────
echo ""
echo ">> [3/4] Uploading CSV to HDFS..."
hdfs dfs -rm -f "$HDFS_BASE/input/submissions.csv" || true

if [ -f "$CSV_LOCAL" ]; then
  hdfs dfs -put "$CSV_LOCAL" "$HDFS_BASE/input/submissions.csv"
else
  echo "   Streaming directly from S3 ($S3_URI) into HDFS DataNode (no local file stored)..."
  aws s3 cp "$S3_URI" - | hdfs dfs -put -f - "$HDFS_BASE/input/submissions.csv"
fi
echo "   Uploaded to HDFS: $HDFS_BASE/input/submissions.csv"

# ── Step 5: Verify with fsck ──────────────────────────────────────────────────
echo ""
echo ">> [4/4] Running HDFS fsck to verify blocks and replication..."
echo "──────────────────────────────────────────────"
hdfs fsck "$HDFS_BASE/input/submissions.csv" -files -blocks -locations || true
echo "──────────────────────────────────────────────"

echo ""
echo "✓ HDFS setup complete. Ready to run MapReduce job."
echo "  Next: bash jobs/run_job.sh"
