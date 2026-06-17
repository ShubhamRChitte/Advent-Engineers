const fs = require('fs');

function fixPS() {
  const file = 'src/components/tester/SecondaryPSReport.tsx';
  let data = fs.readFileSync(file, 'utf8');

  // Remove unused vars
  data = data.replace(/const displayBurden = \(\(\) => \{[\s\S]*?\}\)\(\);\n\n\s*const displaySTC = \(\(\) => \{[\s\S]*?\}\)\(\);\n\n/g, '');

  fs.writeFileSync(file, data);
  console.log('PS fixed');
}

fixPS();
