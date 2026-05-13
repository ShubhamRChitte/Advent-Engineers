const fs = require('fs');
const content = fs.readFileSync('C:/Users/HP/Desktop/ADVENT ENGINEERS/Advent-Engineers/Backend/index.js', 'utf8');

let b = 0, p = 0;
let inString = null;
let inComment = false;
let inMultiLineComment = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i+1];
    
    if (inComment) {
        if (char === '\n') inComment = false;
        continue;
    }
    if (inMultiLineComment) {
        if (char === '*' && nextChar === '/') {
            inMultiLineComment = false;
            i++;
        }
        continue;
    }
    if (inString) {
        if (char === inString) {
            if (content[i-1] !== '\\') inString = null;
        }
        continue;
    }
    
    if (char === '/' && nextChar === '/') {
        inComment = true;
        i++;
        continue;
    }
    if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        i++;
        continue;
    }
    if (char === "'" || char === '"' || char === '`') {
        inString = char;
        continue;
    }
    
    if (char === '{') b++;
    if (char === '}') b--;
    if (char === '(') p++;
    if (char === ')') p--;
}

console.log(`Final state: Braces: ${b}, Parens: ${p}, InString: ${inString}`);
if (inString) {
    console.log("Unclosed string found!");
}
