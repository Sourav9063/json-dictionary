# Project: JSON Dictionary Converter

## Overview
This project is a Node.js utility designed to parse the text of Webster's Unabridged English Dictionary (sourced from Project Gutenberg) and convert it into a structured JSON format. It allows developers to easily utilize dictionary data in applications without parsing raw text files manually.

## Architecture
The system consists of a single Node.js script that processes a raw text file line-by-line to identify words and their corresponding definitions.

- **Input:** A plain text file containing the dictionary (e.g., `dictionary/pg29765.txt`).
- **Processing:** The script identifies words (all uppercase lines) and definitions (prefixed with `Defn: `) and aggregates them.
- **Output:** A JSON file where keys are words (lowercase) and values are definitions.

## Key Files

- **`converter.js`**: The core script that performs the parsing.
    - *Note:* The `README.md` references `parser.js`, but the actual file in this repository is `converter.js`.
    - Configuration: Includes a `SORT_INTO_ALPHA_ARRAYS` constant to toggle between a flat object or an array of 26 objects (A-Z).
- **`dictionary/pg29765.txt`**: The source text file from Project Gutenberg.
- **`output.json`**: The generated JSON output (artifact).
- **`index.html`**: Currently empty/unused.

## Usage

### Prerequisites
- Node.js installed on the system.

### Running the Converter
To convert the dictionary text file to JSON, run the following command from the project root:

```bash
node converter.js dictionary/pg29765.txt output.json
```

### format
The output JSON structure (by default) is a flat object:

```json
{
  "word": "The definition text...",
  "another word": "Its definition..."
}
```

If `SORT_INTO_ALPHA_ARRAYS` is set to `true` in `converter.js`, the output will be an array of objects indexed by letter.
