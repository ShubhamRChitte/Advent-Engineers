const fs = require('fs');
const content = fs.readFileSync('C:/Users/HP/Desktop/ADVENT ENGINEERS/Advent-Engineers/Backend/index.js', 'utf8');
const lines = content.split('\n');

let b = 0, p = 0;
for (let i = 0; i < 3180; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') b++;
        if (char === '}') b--;
        if (char === '(') p++;
        if (char === ')') p--;
    }
    if (i >= 3165) {
        console.log(`Line ${i+1}: b=${b}, p=${p} | ${line.trim()}`);
    }
}
