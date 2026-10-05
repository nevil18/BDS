#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  perf_test.sh  –  MapReduce job benchmarking on local machine
#  Student 1 + Student 2 – Joint Contribution
#
#  Run from project root:
#    bash scripts/perf_test.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "══════════════════════════════════════════════════"
echo "  PERFORMANCE BENCHMARK: MapReduce Execution"
echo "══════════════════════════════════════════════════"

# Record start time
START=$(date +%s)

# Execute job runner
bash "${PROJECT_ROOT}/jobs/run_job.sh" --rerun

END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "══════════════════════════════════════"
echo "  PERFORMANCE SUMMARY"
echo "══════════════════════════════════════"
echo "  Execution Time: ${ELAPSED} seconds"
echo "  Output Location: /tmp/mapreduce_output.txt"
echo "══════════════════════════════════════"
