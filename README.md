# Distributed Analysis of Competitive Programming Submissions
## Big Data Systems Project | Native Hadoop MapReduce + MongoDB

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NATIVE HOST ENVIRONMENT                               │
│                                                                                         │
│  ┌────────────────────────┐       ┌────────────────────────┐       ┌─────────────────┐  │
│  │   AMAZON S3 BUCKET     │       │     LOCAL HDFS & YARN  │       │  LOCAL MONGODB  │  │
│  │ (s3://bigdata1234567890│──────►│  (hdfs://localhost:9000│──────►│ (mongodb://     │  │
│  │  /submissions_2million)│ Direct│  /user/hadoop/codeforces)│ Ingest│  127.0.0.1)     │  │
│  │                        │ Stream│                        │       │                 │  │
│  │  • 2M CSV Submissions  │ (0 MB │  • 7 Map Splits        │ 50 ms │ • DB: codeforces│  │
│  │  • 150 MB Dataset      │ Disk) │  • Node.js MapReduce   │ Batch │ • Col: stats    │  │
│  └────────────────────────┘       └────────────────────────┘       └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Data Pipeline Flow:
  Amazon S3 (Direct Pipe) ──► HDFS DataNode Storage ──► Hadoop Streaming MapReduce ──► MongoDB Batch Ingestion ──► Analytical Queries
```

---

## 🚀 Key Technical Highlights

1. **Zero-Disk S3 Direct Ingestion**: Streams the 2-million row S3 dataset directly into HDFS DataNode storage (`aws s3 cp ... | hdfs dfs -put -`) with **0 MB local disk storage used**.
2. **Native Hadoop Streaming**: Uses pure Node.js (`mapper.js`, `combiner.js`, `reducer.js`) over native Hadoop HDFS & YARN framework.
3. **Ultra-Fast MongoDB Loader**: Optimized `jobs/load.js` pre-aggregates key-verdict counts in memory, reducing ingestion time from **90 seconds to 0.05 seconds** (50 ms).
4. **All-in-One Automation**: Single shell command (`bash run_all.sh`) verifies HDFS/YARN daemons, executes MapReduce, streams to MongoDB, and displays analytics.

---

## 👥 Team Roles & Module Division

| Module | File / Script | Owner | Responsibility |
|---|---|---|---|
| **Ingestion & Cluster** | `scripts/hdfs_setup.sh`<br>`scripts/perf_test.sh` | **Student 1** | Direct S3 to HDFS streaming, directory creation, block replication check (`fsck`). |
| **MapReduce Compute** | `jobs/mapper.js`<br>`jobs/combiner.js`<br>`jobs/reducer.js`<br>`jobs/run_job.sh` | **Student 2** | RFC-4180 CSV parsing, mapper key-value emission, combiner optimization, reducer summation. |
| **MongoDB & Analytics** | `jobs/load.js`<br>`jobs/queries.js` | **Student 3** | In-memory stream aggregation, MongoDB batch loading (`codeforces.stats`), analytical queries. |

---

## 🗂️ Dataset Specification

- **Source**: Codeforces Public Submissions Dataset
- **S3 Bucket URI**: `s3://bigdata1234567890/submissions_2million.csv`
- **Public Browser URL**: [https://bigdata1234567890.s3.ap-south-1.amazonaws.com/submissions_2million.csv](https://bigdata1234567890.s3.ap-south-1.amazonaws.com/submissions_2million.csv)
- **Rows**: 2,000,000 submission records
- **File Size**: 150 MB (150,059,170 bytes)

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB installed & running locally (`mongodb://127.0.0.1:27017`)
- Local Hadoop (HDFS & YARN) installed

### Single-Command Execution

```bash
bash run_all.sh
```

---

## 📖 Step-by-Step Manual Execution

### Step 1: Start Hadoop Daemons
```bash
start-dfs.sh
start-yarn.sh
jps
```

### Step 2: Ingest Dataset from S3 into HDFS
```bash
bash scripts/hdfs_setup.sh
```

### Step 3: Run Hadoop Streaming MapReduce Job
```bash
bash jobs/run_job.sh --rerun
```

### Step 4: Batch Load MapReduce Results into MongoDB
```bash
node jobs/load.js
```

### Step 5: Execute Analytical Queries
```bash
node jobs/queries.js
```

---

## 📊 Analytical Query Results & Benchmarks

### Benchmark Performance
- **MapReduce Execution Time**: 18 seconds (on HDFS & YARN)
- **MongoDB Load Time**: 0.05 seconds (78 aggregated documents)
- **Total Pipeline Execution**: 26.6 seconds

### Query Output Summary (2-Million Dataset)

#### Q1: Top 10 Languages by Time Limit Exceeded (TLE)
```text
Language                        TLE Count   
────────────────────────────────────────────
GNU C++17                       57,443      
Python 3                        28,705      
PyPy 3                          21,605      
GNU C++20                       17,904      
Java 11                         14,450      
Java 17                         9,133       
GNU C++23                       7,334       
C                               5,464       
C#                              3,697       
JavaScript                      3,644       
```

#### Q2: Top 10 Languages by Memory Limit Exceeded (MLE)
```text
Language                        MLE Count   
────────────────────────────────────────────
GNU C++17                       19,157      
Python 3                        9,643       
PyPy 3                          7,289       
GNU C++20                       6,023       
Java 11                         4,874       
Java 17                         2,999       
GNU C++23                       2,444       
C                               1,852       
Kotlin                          1,232       
C#                              1,227       
```

#### Q3: Acceptance Rate per Language (min 50 submissions)
```text
Language                        Total       Accepted    Accept Rate 
───────────────────────────────────────────────────────────────────
GNU C++17                       640,630     333,180     52.0%       
Python 3                        319,382     165,963     52.0%       
PyPy 3                          239,554     124,069     51.8%       
GNU C++20                       199,748     104,023     52.1%       
Java 11                         160,789     83,594      52.0%       
Java 17                         100,126     52,004      51.9%       
GNU C++23                       80,547      41,757      51.8%       
C                               59,696      30,806      51.6%       
Kotlin                          40,081      20,936      52.2%       
JavaScript                      39,845      20,798      52.2%       
C#                              40,296      20,777      51.6%       
Go                              39,873      20,776      52.1%       
Rust                            39,433      20,441      51.8%       
```

#### Q5: Most Common Judge Verdicts
```text
Verdict                         Count       
────────────────────────────────────────────
Accepted                        1,039,124   
Wrong Answer                    500,529     
Time Limit Exceeded             180,143     
Runtime Error                   120,081     
Compilation Error               99,850      
Memory Limit Exceeded           60,273      
```

---

## 🛠️ Repository File Summary

- **`run_all.sh`**: Main execution pipeline script.
- **`README.md`**: Project documentation and reference manual.
- **`jobs/mapper.js`**: MapReduce mapper logic (emits `language \t verdict \t 1`).
- **`jobs/combiner.js`**: MapReduce combiner logic (pre-aggregates intermediate counts).
- **`jobs/reducer.js`**: MapReduce reducer logic (calculates final global sums).
- **`jobs/run_job.sh`**: Hadoop streaming submission script for HDFS & YARN.
- **`jobs/load.js`**: Optimized MongoDB batch loader.
- **`jobs/queries.js`**: Analytical queries engine.
- **`scripts/hdfs_setup.sh`**: Direct S3 to HDFS streaming ingestion script.
- **`scripts/local_test.sh`**: Pipeline testing utility.
- **`scripts/perf_test.sh`**: Performance benchmarking utility.
