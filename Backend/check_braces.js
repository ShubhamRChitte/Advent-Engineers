const fs = require('fs');

const content = fs.readFileSync('d:/Advent/Backend/index.js', 'utf8');
const lines = content.split('\n');

let balance = 0;
let stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') {
            balance++;
            stack.push({ line: i + 1, char: '{' });
        } else if (char === '}') {
            balance--;
            if (stack.length > 0) {
                stack.pop();
            } else {
                console.log(`Error: Extra '}' at line ${i + 1}`);
            }
        }
    }
}

if (balance > 0) {
    console.log(`Error: Unclosed '{'. Balance is ${balance}.`);
    console.log(`Last 5 open braces at:`);
    stack.slice(-5).forEach(item => console.log(`Line ${item.line}`));
} else if (balance === 0) {
    console.log("Braces are balanced.");
} else {
    console.log(`Error: Extra '}'. Balance is ${balance}.`);
}
