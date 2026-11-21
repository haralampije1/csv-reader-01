# csv-reader-01

A fast, exact drop-in replacement for csv-reader 1.0.0: reads broken CSV files exactly as csv-reader 1.0.0 does, answering `{columns, rows, errors}` per case.

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/haralampije1/csv-reader-01/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/haralampije1/csv-reader-01/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

## Run it

```sh
node main.ts
```

`main.ts` reads every case from `MAKEFUN_INPUT_DIR/cases.json` (or `/input/cases.json`) and writes every answer to `MAKEFUN_OUTPUT_DIR/answers.json` (or `/output/answers.json`). It delegates to `solve.js`, which is a dependency-free drop-in replacement for csv-reader 1.0.0's `run(input)`.
