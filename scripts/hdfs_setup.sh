#!/bin/bash
# hdfs_setup.sh – Ingest CSV from S3 directly into HDFS
set -euo pipefail

HDFS_BASE="/user/hadoop/codeforces"
S3_URI="s3://bigdata1234567890/submissions_2million.csv"

echo ">> Creating HDFS directories..."
hdfs dfs -mkdir -p "$HDFS_BASE/input"

echo ">> Streaming CSV from S3 into HDFS..."
aws s3 cp "$S3_URI" - | hdfs dfs -put -f - "$HDFS_BASE/input/submissions.csv"

echo "✓ Uploaded dataset to HDFS: $HDFS_BASE/input/submissions.csv"
