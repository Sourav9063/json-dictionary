const fs = require('fs');
const path = require('path');

// Constants for parsing logic
const ASCII_ALPHA_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-";
const DEFINITION_PREFIX = "Defn: ";
const ITEM_PREFIX_NUMERICAL = "1.";
const ITEM_PREFIX_ALPHABETIZED = "(a)";

// Grab arguments: [inputPath, outputDirPath]
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error("Usage: node converter.js <input_file> <output_directory>");
    process.exit(1);
}

const [inputFilePath, outputDirPath] = args;

// State Variables
// We'll store data in an array of 26 objects (one for each letter A-Z)
let alphaDictionary = Array.from({ length: 26 }, () => ({}));
let currentWords = null;
let currentDefinition = "";
let definitionStarted = false;

// Character set validation for word detection
const isWordLine = (line) => {
    if (!line.trim()) return false;
    // Checks if the line contains only uppercase A-Z, hyphens, semicolons, or spaces
    return [...line].every(char => ASCII_ALPHA_UPPERCASE.includes(char) || char === ';' || char === ' ');
};

function finishCurrentWord() {
    if (currentWords && currentDefinition) {
        const cleanedDefinition = currentDefinition.trim();
        // Split synonyms/multiple words
        const words = currentWords.split(';').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

        words.forEach(word => {
            // Determine which dictionary bin (0-25) this word belongs to
            const asciiValue = word.charCodeAt(0) - 97; // 'a' is 97
            
            // Only process if it starts with a-z
            if (asciiValue >= 0 && asciiValue < 26) {
                const targetDict = alphaDictionary[asciiValue];
                
                if (!targetDict[word]) {
                    targetDict[word] = cleanedDefinition;
                } else {
                    targetDict[word] += "\n\n" + cleanedDefinition;
                }
            }
        });
    }
    currentWords = null;
    currentDefinition = "";
    definitionStarted = false;
}

// Read file using a stream to handle large files
console.log(`Reading: ${inputFilePath}...`);
try {
    const fileContent = fs.readFileSync(inputFilePath, 'utf8');
    const lines = fileContent.split(/\r?\n/);
    const totalLines = lines.length;

    lines.forEach((line, index) => {
        const trimmedLine = line.trimEnd();

        if (isWordLine(trimmedLine)) {
            finishCurrentWord();
            currentWords = trimmedLine;
        } else if (trimmedLine.startsWith(DEFINITION_PREFIX)) {
            definitionStarted = true;
            const text = trimmedLine.substring(DEFINITION_PREFIX.length).trim();
            currentDefinition += (currentDefinition ? " " : "") + text;
        } else if ((definitionStarted || currentWords) && (trimmedLine.startsWith(ITEM_PREFIX_NUMERICAL) || trimmedLine.startsWith(ITEM_PREFIX_ALPHABETIZED))) {
            definitionStarted = true;
            currentDefinition += (currentDefinition ? " " : "") + trimmedLine;
        } else if (definitionStarted && currentWords && trimmedLine.length > 0) {
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

    // Prepare Output Logic
    console.log("Parsing complete. Generating output files...");

    // Ensure output directory exists
    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
    }
    const alphaDirPath = path.join(outputDirPath, 'alpha');
    if (!fs.existsSync(alphaDirPath)) {
        fs.mkdirSync(alphaDirPath, { recursive: true });
    }

    // 1. Write all-alpha.json (Array of 26 objects)
    const allAlphaPath = path.join(outputDirPath, 'all-alpha.json');
    fs.writeFileSync(allAlphaPath, JSON.stringify(alphaDictionary, null, 2), 'utf8');
    console.log(`Saved: ${allAlphaPath}`);

    // 2. Write alpha/a.json ... z.json
    console.log(`Saving individual alpha files to ${alphaDirPath}...`);
    alphaDictionary.forEach((dict, index) => {
        const letter = String.fromCharCode(97 + index);
        const letterPath = path.join(alphaDirPath, `${letter}.json`);
        fs.writeFileSync(letterPath, JSON.stringify(dict, null, 2), 'utf8');
    });

    // 3. Write all.json (Original flat format)
    // Merge all 26 dictionaries into one
    const flatDictionary = Object.assign({}, ...alphaDictionary);
    const allPath = path.join(outputDirPath, 'all.json');
    fs.writeFileSync(allPath, JSON.stringify(flatDictionary, null, 2), 'utf8');
    console.log(`Saved: ${allPath}`);

    console.log("All operations completed successfully.");

} catch (err) {
    console.error("Error processing file:", err);
    process.exit(1);
}
