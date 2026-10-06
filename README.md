# QueryLens · Group 3

An end-to-end e-commerce search query frequency and ranking analyzer. C++17 performs the analysis; a React dashboard provides input and results; a Node/Express API passes text to the compiled C++ executable without shell interpolation.

## Run locally

Requirements: Node.js 20.19+ (or 22+), npm, and g++ with C++17 support.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API runs on port 3001. The development frontend proxies `/api` to it. The dashboard starts with editable sample input; click **Analyze queries** to generate real results.

Production:

```bash
npm run build
npm start
```

Open http://localhost:3001. `PORT` can customize the production port. These commands run a local/demo service; no authentication or persistent storage is included.

## Console deliverable

```bash
npm run console
# Type one query per line, then Ctrl+D to finish input on Linux/macOS.
# Or use a text file:
./build/analyzer < queries.txt
./build/analyzer --case-sensitive < queries.txt
./build/analyzer --json < queries.txt
```

The default console mode prints an alphabetical frequency table and a descending frequency ranking. Ties are ordered alphabetically. `npm run build:cpp` builds only the C++ program.

## Dashboard

- Paste one complete query per line, import a `.txt` file, or load the sample.
- Toggle case handling and analyze.
- See total searches, unique queries, the most frequent query, and repeat percentage.
- Filter results and switch between volume ranking and alphabetical order.
- Inspect actual C++ lookup timings and a console-style rendering.
- Export ranked results as CSV (leading spreadsheet formula characters are escaped).
- Edited input shows a reminder until results are recalculated.

This project analyzes **search query occurrences**, as specified in the problem statement. It cannot infer order frequency or customer-level rankings without order and customer records. Each complete line is one key, not a bag of individual words.

## C++ concepts and algorithm

1. Read lines into `std::string`, trim/collapse whitespace, and optionally fold ASCII A–Z to lowercase. UTF-8 bytes otherwise remain intact; sorting is bytewise, not locale-aware.
2. Keep normalized input in `std::vector<std::string>`.
3. Increment `std::map<std::string, int>` using `++counts[query]`.
4. Iterate the map for a key-ordered table.
5. Copy map entries to `std::vector<std::pair<std::string, int>>` and sort by descending count, then ascending query for ties.
6. Compare `map.find(key)` with a linear scan over the same unique entries in a vector.

For Q input lines and U unique queries: counting requires O(Q log U) map operations, ranking O(U log U) comparisons, map lookup O(log U) comparisons, and vector lookup O(U) comparisons. String comparisons additionally depend on string length. Memory is O(Q + U) string entries in this implementation.

The benchmark performs 20,000 successful lookups per container, cycling alphabetically through the unique keys. Container construction is excluded. A volatile checksum prevents elimination of lookup work. Times come from `std::chrono::steady_clock` in microseconds and display in milliseconds. These are illustrative single-run timings, not rigorous statistical benchmarks; CPU scheduling, caches, key lengths, order, and small-input overhead affect results. Vectors can be faster on small datasets. Empty inputs produce zero operations.

Repeat percentage is `(total - unique) / total × 100`, or zero for empty input. Share is `count / total × 100`. Limits are 10,000 input lines and 500 UTF-8 bytes per line through the API. Blank lines are ignored by the analyzer.

## API

`POST /api/analyze` with JSON:

```json
{"queries":"shoes\nwatch\nshoes", "caseSensitive":false}
```

Returns `total`, `unique`, `alphabetical`, `ranked`, and `benchmark` (`operations`, `mapUs`, `vectorUs`). `GET /api/health` reports service status. Invalid input receives a JSON error. The engine has a 15-second timeout.

## Verification and layout

```bash
npm test
npm run build
```

Tests cover counts, ordering, ties, normalization, case sensitivity, empty input, escaping, Unicode preservation, console output, and input limits.

- `cpp/analyzer.cpp`: standalone C++ engine and terminal output
- `server/index.js`: validated HTTP bridge and production static hosting
- `src/main.jsx`: React dashboard
- `src/styles.css`: responsive styling
- `tests/analyzer.test.js`: C++ regression tests

Google Fonts is optional; local sans-serif fallbacks work when offline. The application does not persist uploaded query data to disk.
