const fs = require('fs');
const path = require('path');

// Constants for parsing logic
const ASCII_ALPHA_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-";
const MULTI_WORD_SEPARATOR = "; ";
const DEFINITION_PREFIX = "Defn: ";
const ITEM_PREFIX_NUMERICAL = "1.";
const ITEM_PREFIX_ALPHABETIZED = "(a)";

// Grab arguments: [inputPath, outputPath]
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error("Usage: node parser.js <input_file> <output_file>");
    process.exit(1);
}

const [inputFilePath, outputFilePath] = args;

/**
 * Configuration: Set to true if you want the 26-array structure (A-Z),
 * otherwise it generates one large flat object.
 */
const SORT_INTO_ALPHA_ARRAYS = false;

// State Variables
let compiledDictionary = SORT_INTO_ALPHA_ARRAYS ? Array.from({ length: 26 }, () => ({})) : {};
let currentWords = null;
let currentDefinition = "";

// Character set validation for word detection
const isWordLine = (line) => {
    if (!line.trim()) return false;
    // Checks if the line contains only uppercase A-Z, hyphens, or semicolons
    return [...line].every(char => ASCII_ALPHA_UPPERCASE.includes(char) || char === ';');
};

function finishCurrentWord() {
    if (currentWords && currentDefinition) {
        const cleanedDefinition = currentDefinition.trim();
        const words = currentWords.split(';').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

        words.forEach(word => {
            let targetDict = compiledDictionary;
            
            if (SORT_INTO_ALPHA_ARRAYS) {
                const asciiValue = word.charCodeAt(0) - 97; // 'a' is 97
                if (asciiValue >= 0 && asciiValue < 26) {
                    targetDict = compiledDictionary[asciiValue];
                } else {
                    return; // Skip non-alpha starters
                }
            }

            if (!targetDict[word]) {
                targetDict[word] = cleanedDefinition;
            } else {
                targetDict[word] += "\n\n" + cleanedDefinition;
            }
        });
    }
    currentWords = null;
    currentDefinition = "";
}

// Read file using a stream to handle large files
console.log(`Reading: ${inputFilePath}...`);
const fileContent = fs.readFileSync(inputFilePath, 'utf8');
const lines = fileContent.split(/\r?\n/);
const totalLines = lines.length;

lines.forEach((line, index) => {
    const trimmedLine = line.trimEnd();

    if (isWordLine(trimmedLine)) {
        finishCurrentWord();
        currentWords = trimmedLine;
    } else if (trimmedLine.startsWith(DEFINITION_PREFIX)) {
        const text = trimmedLine.substring(DEFINITION_PREFIX.length).trim();
        currentDefinition += (currentDefinition ? " " : "") + text;
    } else if (trimmedLine.startsWith(ITEM_PREFIX_NUMERICAL) || trimmedLine.startsWith(ITEM_PREFIX_ALPHABETIZED)) {
        currentDefinition += (currentDefinition ? " " : "") + trimmedLine;
    } else if (currentWords && trimmedLine.length > 0) {
        // We are inside a definition block, continuing the text
        currentDefinition += (currentDefinition ? " " : "") + trimmedLine.trim();
    }

    // Progress Reporting
    if (index % 10000 === 0) {
        const percent = Math.floor((index / totalLines) * 100);
        console.log(`Progress: ${percent}%`);
    }
});

// Finalize the last entry
finishCurrentWord();

// Save to JSON
console.log("Saving JSON...");
try {
    fs.writeFileSync(outputFilePath, JSON.stringify(compiledDictionary, null, 2), 'utf8');
    console.log(`Finished. Output saved to: ${outputFilePath}`);
} catch (err) {
    console.error("Error writing file:", err);
}