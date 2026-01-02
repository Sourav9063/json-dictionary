# Project Overview

This project is a Dictionary and Vocabulary Utility suite designed to process raw dictionary data and provide user-friendly tools for language learners. It consists of a data processing pipeline and two web-based frontends.

**Core Components:**

1.  **Data Converter (`converter.js`):** A Node.js script that processes the Project Gutenberg Webster's Unabridged Dictionary. It parses the raw text and generates structured JSON files, optimized for web use by chunking them alphabetically. It includes a `FILTERED` flag to optionally strip etymologies, domain tags, and other metadata for cleaner definitions.
2.  **Dictionary Search (`index.html`):** A lightweight web interface for searching definitions. It implements an autocomplete feature and fetches dictionary data on-demand (lazy loading) to ensure performance.
3.  **SRT Vocabulary Extractor (`srt.html`):** A tool for language learners. It analyzes subtitle (`.srt`) files, filters out common English words (using frequency lists), and generates a study list of "uncommon" vocabulary words. It also offers a feature to download a new `.srt` file with concise definitions embedded directly into the subtitles.

## Key Files & Directories

*   **`converter.js`**: The main ETL script. Converts raw text dictionary to JSON.
*   **`index.html`**: The main entry point for the dictionary search web app.
*   **`srt.html`**: The vocabulary extractor web tool.
*   **`dictionary/`**: Contains the raw source data.
    *   `pg29765.txt`: The full raw text of Webster's Unabridged Dictionary.
    *   `top_english_words_lower_*.txt`: Word frequency lists (5k, 10k, 20k) used for filtering common words.
*   **`output/`**: The target directory for the generated JSON dictionary files.
*   **`filtered/`**: Contains pre-generated or alternative JSON dictionary datasets.

## Usage

### 1. Generating Dictionary Data
To parse the raw dictionary and generate the JSON files, run the converter script:

```bash
node ./converter.js ./dictionary/pg29765.txt ./output
```

This will create:
*   `output/all.json`: The complete dictionary.
*   `output/all-alpha.json`: An array of 26 objects (one per letter).
*   `output/alpha/[a-z].json`: Individual files for each letter (used for lazy loading).

### 2. Running the Web Interface
Because the web applications fetch JSON files via `fetch()`, they must be served over HTTP/HTTPS to avoid CORS errors (browsers often block `fetch` from `file://` protocols).

**Using Python:**
```bash
# Python 3
python3 -m http.server

# Python 2
python -m SimpleHTTPServer
```

**Using Node:**
```bash
npx http-server .
```

After starting the server, open `http://localhost:8000/index.html` or `http://localhost:8000/srt.html` in your browser.

## Development Conventions

*   **No Build Step:** The project uses vanilla HTML, CSS, and JavaScript. No transpilation or bundling is required.
*   **Lazy Loading:** The frontend is designed to load dictionary chunks (`a.json`, `b.json`, etc.) only when needed to keep the initial load time fast.
*   **Data Structure:** The dictionary is stored as a key-value pair where the key is the word (lowercase) and the value is the definition.
