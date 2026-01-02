const fs = require('fs');
const path = require('path');

const FILTERED = true;

// distinct file paths
const inputPath = path.join(__dirname, 'dictionary.json');
const outputPath = path.join(__dirname, `${FILTERED?"filtered-":""}dictionary.json`);

console.log(`Reading from: ${inputPath} (Filtered: ${FILTERED})`);

try {
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const dictionary = JSON.parse(rawData);
  const transformed = {};

  // Iterate over each word in the dictionary
  for (const [word, data] of Object.entries(dictionary)) {
    if (FILTERED) {
      if (word.length <= 2 || word.includes('.')) {
        continue;
      }
    }
    
    // Extract definitions
    // MEANINGS values are arrays where index 1 is the definition
    // e.g. "1": ["Noun", "the definition", ...]
    const meanings = [];
    if (data.MEANINGS) {
      Object.values(data.MEANINGS).forEach(entry => {
        if (Array.isArray(entry) && entry.length > 1) {
          meanings.push(entry[1]);
        }
      });
    }

    // If no meanings found, look up synonyms to see if they have meanings
    if (meanings.length === 0 && data.SYNONYMS) {
      for (const synonym of data.SYNONYMS) {
        const synonymKey = synonym.toUpperCase();
        // Check if synonym exists in dictionary, is not the word itself, and has meanings
        if (synonymKey !== word && dictionary[synonymKey] && dictionary[synonymKey].MEANINGS) {
          Object.values(dictionary[synonymKey].MEANINGS).forEach(entry => {
            if (Array.isArray(entry) && entry.length > 1) {
              meanings.push(entry[1]);
            }
          });
          // If we found meanings, stop searching
          if (meanings.length > 0) {
            break;
          }
        }
      }
    }

    // Extract synonyms and filter out those that are the same as the word itself
    const synonyms = (data.SYNONYMS || []).filter(synonym => synonym.toUpperCase() !== word.toUpperCase());

    const meaningsString = meanings.join("; ");
    const synonymsString = synonyms.join(", ");
    transformed[word] = [meaningsString, synonymsString].filter(Boolean).join(". ");
  }

  // Write the result
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`Conversion complete. Output written to: ${outputPath}`);

} catch (error) {
  console.error('An error occurred:', error.message);
}
