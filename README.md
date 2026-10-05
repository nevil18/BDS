# Distributed Analysis of Competitive Programming Submissions
## Big Data Systems Project | Native Hadoop MapReduce + MongoDB

## 📐 System Architecture

Data Pipeline Flow:
  Amazon S3 (Direct Pipe) ──► HDFS DataNode Storage ──► Hadoop Streaming MapReduce ──► MongoDB Batch Ingestion ──► Analytical Queries

## 👥 Team Roles & Module Division

| Module | File / Script | Owner | Responsibility |
|---|---|---|---|
| Ingestion & Cluster | scripts/hdfs_setup.sh, scripts/perf_test.sh | Student 1 (mihir1707) | Direct S3 to HDFS streaming, block replication check. |
| MapReduce Compute | jobs/mapper.js, jobs/combiner.js, jobs/reducer.js, jobs/run_job.sh | Student 2 (nevil18) | RFC-4180 CSV parsing, key-value emission, combiner optimization, reducer summation. |
| MongoDB & Analytics | jobs/load.js, jobs/queries.js | Student 3 (PrinceUkani) | Stream aggregation, MongoDB batch loading, analytical queries. |
