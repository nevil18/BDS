#!/bin/bash
# run_job.sh – Submit MapReduce job using HDFS & YARN
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_FILE="/tmp/mapreduce_output.txt"
HDFS_INPUT="/user/hadoop/codeforces/input"
HDFS_OUTPUT="/user/hadoop/codeforces/output"

JAR=$(find /home/hadoopuser/hadoop /usr/local/hadoop -name "hadoop-streaming-*.jar" 2>/dev/null | head -1 || true)

if [[ "${1:-}" == "--rerun" ]]; then
  rm -f "$OUTPUT_FILE"
  hdfs dfs -rm -r -skipTrash "$HDFS_OUTPUT" 2>/dev/null || true
fi

hadoop jar "$JAR" \
  -D mapreduce.job.name="CF_Submissions_Analysis" \
  -D mapreduce.framework.name=local \
  -D mapreduce.job.reduces=1 \
  -input  "$HDFS_INPUT/submissions.csv" \
  -output "$HDFS_OUTPUT" \
  -mapper  "node ${PROJECT_ROOT}/jobs/mapper.js" \
  -combiner "node ${PROJECT_ROOT}/jobs/combiner.js" \
  -reducer "node ${PROJECT_ROOT}/jobs/reducer.js"

hdfs dfs -cat "$HDFS_OUTPUT/part-*" > "$OUTPUT_FILE"
