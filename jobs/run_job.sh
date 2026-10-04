#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  run_job.sh  –  Submit MapReduce job strictly using HDFS & YARN
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CSV_INPUT="${PROJECT_ROOT}/data/submissions.csv"
OUTPUT_FILE="/tmp/mapreduce_output.txt"

HDFS_INPUT="/user/hadoop/codeforces/input"
HDFS_OUTPUT="/user/hadoop/codeforces/output"

# Search for Hadoop streaming jar in local installation paths
HADOOP_SEARCH_PATHS=(
  "${HADOOP_HOME:-}"
  "/usr/local/hadoop"
  "/home/hadoopuser/hadoop"
  "/opt/hadoop"
  "/usr/lib/hadoop"
)

JAR=""
for path in "${HADOOP_SEARCH_PATHS[@]}"; do
  if [ -n "$path" ] && [ -d "$path" ]; then
    FOUND=$(find "$path" -name "hadoop-streaming-*.jar" 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
      JAR="$FOUND"
      break
    fi
  fi
done

HADOOP_BIN=$(which hadoop 2>/dev/null || true)
HDFS_BIN=$(which hdfs 2>/dev/null || true)

# Handle --rerun flag
if [[ "${1:-}" == "--rerun" ]]; then
  echo ">> --rerun: resetting output destination..."
  rm -f "$OUTPUT_FILE"
  if [ -n "$HDFS_BIN" ]; then
    hdfs dfs -rm -r -skipTrash "$HDFS_OUTPUT" 2>/dev/null || true
  fi
fi

# Ensure HDFS and Hadoop binaries are active
if [ -z "$HADOOP_BIN" ] || [ -z "$HDFS_BIN" ] || [ -z "$JAR" ]; then
  echo "============================================================"
  echo "ERROR: Local Hadoop binaries or hadoop-streaming jar not found in PATH."
  echo "Please start HDFS and YARN daemons first:"
  echo "  1. su - hadoopuser"
  echo "  2. start-dfs.sh"
  echo "  3. start-yarn.sh"
  echo "============================================================"
  exit 1
fi

# Ensure dataset is in HDFS
if ! hdfs dfs -test -e "$HDFS_INPUT/submissions.csv" 2>/dev/null; then
  echo ">> Ingesting dataset into HDFS ($HDFS_INPUT)..."
  bash "${PROJECT_ROOT}/scripts/hdfs_setup.sh"
fi

echo ">> Submitting Hadoop Streaming MapReduce job to HDFS & YARN..."
START=$(date +%s)

hadoop jar "$JAR" \
  -D mapreduce.job.name="CF_Submissions_Analysis" \
  -D mapreduce.framework.name=local \
  -D mapreduce.job.reduces=1 \
  -input  "$HDFS_INPUT/submissions.csv" \
  -output "$HDFS_OUTPUT" \
  -mapper  "node ${PROJECT_ROOT}/jobs/mapper.js" \
  -combiner "node ${PROJECT_ROOT}/jobs/combiner.js" \
  -reducer "node ${PROJECT_ROOT}/jobs/reducer.js"

END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "✓ Hadoop MapReduce job finished on HDFS & YARN in ${ELAPSED} seconds."
echo ">> Extracting results from HDFS to $OUTPUT_FILE..."
hdfs dfs -cat "$HDFS_OUTPUT/part-*" > "$OUTPUT_FILE"

echo ""
echo "============================================"
echo "  Top 10 aggregated results:"
echo "============================================"
sort -t$'\t' -k3 -rn "$OUTPUT_FILE" | head -10 || true
