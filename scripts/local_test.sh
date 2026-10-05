#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  local_test.sh  –  Test mapper → combiner → reducer pipeline locally
#  Student 2 – MapReduce Component
#
#  No Docker needed! Simulates what Hadoop Streaming does.
#
#  Usage (from project root):
#    bash scripts/local_test.sh
#
#  Requirements: Node.js installed on your local machine
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

CSV="data/submissions.csv"

if [ ! -f "$CSV" ]; then
  echo "ERROR: $CSV not found. Place your CSV there first."
  exit 1
fi

echo "══════════════════════════════════════════════"
echo "  Local Pipeline Test"
echo "  cat | mapper | sort | combiner | sort | reducer"
echo "══════════════════════════════════════════════"
echo ""

RESULT=$(cat "$CSV" | node jobs/mapper.js | sort | node jobs/combiner.js | sort | node jobs/reducer.js)

echo "$RESULT"
echo ""
echo "── Total distinct (language, verdict) pairs: $(echo "$RESULT" | wc -l)"
echo "── Top 10 by count:"
echo "$RESULT" | sort -t$'\t' -k3 -rn | head -10

echo ""
echo "✓ Local test complete. Output matches expected reducer output format."
