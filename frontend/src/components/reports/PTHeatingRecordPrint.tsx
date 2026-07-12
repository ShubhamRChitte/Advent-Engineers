import React from 'react';

interface PTHeatingRecordPrintProps {
  records?: any[];
}

export function PTHeatingRecordPrint({ records }: PTHeatingRecordPrintProps) {
  // Use records or default to an empty array
  const dataBlocks = records || [];

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-container, .print-container * {
            visibility: visible;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .print-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }

          button {
            display: none;
          }

          table.heating-table {
            border-collapse: collapse;
            width: 100%;
          }

          .heating-table th, .heating-table td {
            border: 1px solid black;
            padding: 6px;
            text-align: center;
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
            font-family: serif;
          }
            
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
            
          .header h2 {
            font-size: 20px;
            font-weight: bold;
            margin: 5px 0;
          }
            
          .header p {
            font-size: 14px;
            margin: 2px 0;
          }
        }
        
        @media screen {
          .print-container {
            display: none;
          }
        }
      `}</style>
      
      <div className="print-container">
        <div className="header">
          <h1>Advent Engineers</h1>
          <p>A-12, MIDC, Malegaon, Sinnar, Nashik</p>
          <h2>Heating Record [33KV PT]</h2>
        </div>

        <table className="heating-table">
          <thead>
            <tr>
              <th>Job No.</th>
              <th>Required Process/temp.</th>
              <th>Duration</th>
              <th>Date and Time of Start</th>
              <th>Date of Completion and Time</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {dataBlocks.length > 0 ? (
              dataBlocks.map((block: any, idx: number) => {
                const s1 = block.processSteps?.[0] || {};
                const s2 = block.processSteps?.[1] || {};
                const s3 = block.processSteps?.[2] || {};
                const s4 = block.processSteps?.[3] || {};

                const jobFormatted = block.jobNo ? block.jobNo : 'JOB123';
                const serialFormatted = block.serialNumber ? block.serialNumber : '';
                const displayJob = serialFormatted ? `${jobFormatted}\n${serialFormatted}` : jobFormatted;

                return (
                  <React.Fragment key={block.id || idx}>
                    <tr>
                      <td rowSpan={4} style={{ whiteSpace: 'pre-wrap' }}>{displayJob}</td>
                      <td>{s1.process || 'Heating 90°C'}</td>
                      <td>{s1.duration || '12 hrs'}</td>
                      <td>{s1.startDate || '--'} {s1.startTime || ''}</td>
                      <td>{s1.completionDate || '--'} {s1.completionTime || ''}</td>
                      <td>{s1.remarks || ''}</td>
                    </tr>
                    <tr>
                      <td>{s2.process || 'V. Heating 90°C'}</td>
                      <td>{s2.duration || '24 hrs'}</td>
                      <td>{s2.startDate || '--'} {s2.startTime || ''}</td>
                      <td>{s2.completionDate || '--'} {s2.completionTime || ''}</td>
                      <td>{s2.remarks || ''}</td>
                    </tr>
                    <tr>
                      <td>{s3.process || 'V. Cooling 60°C'}</td>
                      <td>{s3.duration || '06 hrs'}</td>
                      <td>{s3.startDate || '--'} {s3.startTime || ''}</td>
                      <td>{s3.completionDate || '--'} {s3.completionTime || ''}</td>
                      <td>{s3.remarks || ''}</td>
                    </tr>
                    <tr>
                      <td>{s4.process || 'Oil Filling 60°C'}</td>
                      <td>{s4.duration || '04 hrs'}</td>
                      <td>{s4.startDate || '--'} {s4.startTime || ''}</td>
                      <td>{s4.completionDate || '--'} {s4.completionTime || ''}</td>
                      <td>{s4.remarks || ''}</td>
                    </tr>

                    <tr className="signature-row">
                      <td colSpan={6} style={{ textAlign: 'left' }}>
                        Prepared By: {block.preparedBy ? block.preparedBy.padEnd(10, '_') : '________'} &nbsp;&nbsp;
                        Production Mgr.: {block.productionManager ? block.productionManager.padEnd(10, '_') : '________'} &nbsp;&nbsp;
                        Verified By: {block.verifiedBy ? block.verifiedBy.padEnd(10, '_') : '________'} &nbsp;&nbsp;
                        Date: {block.date ? block.date.padEnd(10, '_') : '________'}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <>
                <tr>
                  <td rowSpan={4}>JOB123</td>
                  <td>Heating 90°C</td>
                  <td>12 hrs</td>
                  <td>--</td>
                  <td>--</td>
                  <td></td>
                </tr>
                <tr>
                  <td>V. Heating 90°C</td>
                  <td>24 hrs</td>
                  <td>--</td>
                  <td>--</td>
                  <td></td>
                </tr>
                <tr>
                  <td>V. Cooling 60°C</td>
                  <td>06 hrs</td>
                  <td>--</td>
                  <td>--</td>
                  <td></td>
                </tr>
                <tr>
                  <td>Oil Filling 60°C</td>
                  <td>04 hrs</td>
                  <td>--</td>
                  <td>--</td>
                  <td></td>
                </tr>

                <tr className="signature-row">
                  <td colSpan={6} style={{ textAlign: 'left' }}>
                    Prepared By: ________ &nbsp;&nbsp;
                    Production Mgr.: ________ &nbsp;&nbsp;
                    Verified By: ________ &nbsp;&nbsp;
                    Date: ________
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
