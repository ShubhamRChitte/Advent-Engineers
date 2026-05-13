const fs = require('fs');
const content = fs.readFileSync('C:/Users/HP/Desktop/ADVENT ENGINEERS/Advent-Engineers/Backend/index.js', 'utf8');

const lines = content.split('\n');
const line3170 = lines[3169]; // 0-indexed

let p = 0;
for(let char of line3170) {
    if (char === '(') p++;
    if (char === ')') p--;
    process.stdout.write(`${char}[${p}] `);
}
console.log("");
