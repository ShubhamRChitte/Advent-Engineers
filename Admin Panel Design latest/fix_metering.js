const fs = require('fs');

function fixMetering() {
  const file = 'src/components/tester/SecondaryMeteringReport.tsx';
  let data = fs.readFileSync(file, 'utf8');

  // Add imports
  data = data.replace(
    /import \{ ImageWithFallback \} from '\.\.\/figma\/ImageWithFallback';/,
    `import { ImageWithFallback } from '../figma/ImageWithFallback';
import { 
  ReportHeader, 
  ReportSectionTitle, 
  CoreInformationBar,
  ReportSignatures,
  formatReportDate,
  secondaryReportPrintStyles 
} from './SecondaryReportPrintLayout';`
  );

  // Remove unused vars
  data = data.replace(/const displayBurden = \(\(\) => \{[\s\S]*?\}\)\(\);\n\n\s*const displaySTC = \(\(\) => \{[\s\S]*?\}\)\(\);\n\n/g, '');

  // Update styles
  data = data.replace(/<style>\{`[\s\S]*?`\}<\/style>/g, '<style>{secondaryReportPrintStyles}</style>');

  // Update main layout block
  const layoutRegex = /<div className="report-header-top">[\s\S]*?<div className="footer-sig">[\s\S]*?<\/div>\n\s*<\/div>/;
  const newLayout = `<ReportHeader
            stage={stage}
            date={formatReportDate(transformer.testHistory?.[\`\${stage}_test\`]?.reportDate)}
            orderNo={transformer.jobId || transformer.uniqueId}
            client={transformer.clientName || 'N/A'}
            unitNo={transformer.uniqueId}
            accuracyClass={accuracyClass}
          />

          <div className="ae-section-container">
            <ReportSectionTitle index={2} title={\`Metering Core Accuracy Test (\${accuracyClass || '-'})\`} />
            <CoreInformationBar label="Metering Core No" value={coreId.startsWith('M-') ? coreId : \`M-\${coreId}\`} />
            <MeteringTable testResults={testResults} onUpdate={(ratioIdx, rowIndex, field, value) => handleDataChange(ratioIdx, rowIndex, field, value)} readOnly={readOnly} />
          </div>

          <ReportSignatures testerName={testerName} />`;
  data = data.replace(layoutRegex, newLayout);

  // Table classes
  data = data.replace(/className="nested-table"/g, 'className="ae-report-table"');

  // Table header rewrite
  const tableHeaderRegex = /<th colSpan=\{2\} rowSpan=\{2\}.*?<\/th>\n\s*<th colSpan=\{2\} style=\{\{ width: '37\.5%' \}\}>100 % Burden<\/th>\n\s*<th colSpan=\{2\} style=\{\{ width: '37\.5%' \}\}>25% Burden<\/th>/s;
  data = data.replace(tableHeaderRegex, `<th colSpan={2}></th>
            <th className="ae-burden-band" colSpan={2}>100% Burden</th>
            <th className="ae-burden-band" colSpan={2}>25% Burden</th>
          </tr>
          <tr>
            <th rowSpan={2} style={{ width: '16%' }}>Core Ratio</th>
            <th rowSpan={2} style={{ width: '12%' }}>% of Primary<br />Current</th>
            <th colSpan={2}>100% Burden</th>
            <th colSpan={2}>25% Burden</th>`);

  data = data.replace(/<th>Ratio Error\(%\)<\/th>/g, '<th>Ratio Error (%)</th>');
  data = data.replace(/<th>Phase Error\(min\)<\/th>/g, '<th>Phase Error (min)</th>');

  // Table row rendering fixes
  const rowRegex = /<td className="font-bold text-left align-middle border-r border-black p-2" rowSpan=\{item\.rows\.length\} style=\{\{ width: '15%' \}\}>\n\s*Metering Core<br\/>Ratio -\{item\.ratioValue\.replace\(\/\\\\\/\/g, '\/'\)\}\n\s*<\/td>/g;
  data = data.replace(rowRegex, `<td className="ae-ratio-cell" rowSpan={item.rows.length}>
                      Ratio - {item.ratioValue.replace(/\\//g, '/')}
                    </td>`);

  const currentRegex = /<td className="font-medium text-center border-r border-black" style=\{\{ width: '10%' \}\}>\{row\.current\}<\/td>/g;
  data = data.replace(currentRegex, '<td className="ae-ratio-cell">{row.current}</td>');

  fs.writeFileSync(file, data);
  console.log('Metering fixed');
}

fixMetering();
