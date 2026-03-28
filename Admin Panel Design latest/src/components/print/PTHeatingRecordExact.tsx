import React from "react";
import logoImage from "figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png";

export function PTHeatingRecordExact({ records = [] }: any) {
  const blocks = records.length ? records : [{}, {}, {}]; // always 3 blocks

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .print-root, .print-root * {
            visibility: visible;
          }

          .print-root {
            position: absolute;
            top: 0;
            left: 0;
            width: 210mm;
          }

          button {
            display: none;
          }
        }

        @media screen {
          .print-root {
            display: none !important;
          }
        }

        .print-root {
          font-family: "Times New Roman", serif;
          font-size: 12px;
          color: black;
        }

        .header-box {
          border: 1.5px solid black;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 10px 0 2px;
        }

        .logo {
          position: absolute;
          left: 10px;
        }

        .company-title {
          font-size: 26px;
          font-weight: bold;
          color: #8b0000;
          text-align: center;
        }

        .company-address {
          font-size: 14px;
          text-align: center;
        }

        .report-title {
          border-top: 1.5px solid black;
          border-bottom: 1.5px solid black;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          padding: 6px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        th, td {
          border: 1.5px solid black;
          padding: 2px;
          font-size: 11px;
          line-height: 1.1;
          text-align: center;
        }

        tr {
          height: 24px;
        }

        .left {
          text-align: left;
          padding-left: 4px;
        }

        .sign-row td {
          text-align: left;
          font-weight: bold;
        }

        .footer {
          text-align: right;
          margin-top: 6px;
          font-size: 12px;
        }
      `}</style>

      <div className="print-root">

        {/* HEADER */}
        <div className="header-box">
          <div className="header-row">
            <div className="logo">
              <img src={logoImage} style={{ height: "60px" }} />
            </div>
            <div>
              <div className="company-title">Advent Engineers</div>
              <div className="company-address">
                A-12, MIDC, Malegaon, Sinnar, Nashik
              </div>
            </div>
          </div>

          <div className="report-title">
            Heating Record [33KV PT]
          </div>
        </div>

        {/* TABLE */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Job No.</th>
              <th style={{ width: "180px" }}>Required Process/temp.</th>
              <th style={{ width: "80px" }}>Duration</th>
              <th style={{ width: "140px" }}>Date and Time of Start</th>
              <th style={{ width: "140px" }}>Date of Completion and Time</th>
              <th style={{ width: "100px" }}>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {blocks.map((block: any, idx: number) => {
              const steps = block.processSteps || [];

              return (
                <React.Fragment key={idx}>

                  {/* TOP META ROW */}
                  <tr>
                    <td className="left">No.- {block.groupNo || block.no || ""}</td>
                    <td colSpan={3}><b>33KV - R = {block.serialNumber || block.rValue || ""}</b></td>
                    <td colSpan={2} className="left">Date: {block.startDate || block.date || ""}</td>
                  </tr>

                  {/* PROCESS ROWS */}
                  {[
                    ["Heating 90°C", "12 hrs"],
                    ["V. Heating 90°C", "24 hrs"],
                    ["V. Cooling 60°C", "06 hrs"],
                    ["Oil Filling 60°C", "04 hrs"]
                  ].map((p, i) => {
                    const step = steps[i] || {};
                    const verticalJobs = block.serials || (block.jobNo ? block.jobNo.split('\n') : []);
                    return (
                      <tr key={i}>
                        {i === 0 && (
                          <td rowSpan={4} className="left" style={{verticalAlign: 'top'}}>
                            {verticalJobs.map((s: string, k: number) => (
                              <div key={k}>{s}</div>
                            ))}
                          </td>
                        )}
                        <td className="left" style={{paddingLeft: '6px'}}>{p[0]}</td>
                        <td>{p[1]}</td>
                        <td>
                          {step.startDate || ""}<br />
                          {step.startTime || ""}
                        </td>
                        <td>
                          {step.completionDate || ""}<br />
                          {step.completionTime || ""}
                        </td>
                        <td>{step.remarks || ""}</td>
                      </tr>
                    );
                  })}

                  {/* SIGNATURE */}
                  <tr className="sign-row">
                    <td colSpan={2}>Prepared By: ______</td>
                    <td colSpan={2}>Production Mgr.: ______</td>
                    <td>Verified By: ______</td>
                    <td>Date: ______</td>
                  </tr>

                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="footer">
          AE-PRD-09 Rev. 02
        </div>
      </div>
    </>
  );
}
