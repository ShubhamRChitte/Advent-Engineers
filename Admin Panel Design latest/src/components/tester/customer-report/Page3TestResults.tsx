import React from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

interface AccuracyRow {
  percentage: string;
  ratioError100: string;
  phaseError100: string;
  ratioError25: string;
  phaseError25: string;
}

interface Page3Props {
  reportNo: string;
  date: string;
  ptRatio: string;
  burden: string;
  accuracyClass: string;
  // Accuracy test rows (metering core)
  meteringRows: AccuracyRow[];
  // Terminal marking
  primaryTerminals: string;
  secondaryTerminals: string;
  terminalMarkingResult: string;
  // HV primary winding
  hvPrimaryResult: string;
  preparedBy: string;
  preparedByTitle: string;
  checkedBy: string;
  checkedByTitle: string;
  authorisedBy: string;
  authorisedByTitle: string;
}

export function Page3TestResults({
  reportNo, date, ptRatio, burden, accuracyClass,
  meteringRows,
  primaryTerminals, secondaryTerminals, terminalMarkingResult,
  hvPrimaryResult,
  preparedBy, preparedByTitle, checkedBy, checkedByTitle, authorisedBy, authorisedByTitle
}: Page3Props) {
  return (
    <div className="cr-page">
      {/* Header */}
      <table className="cr-header-table">
        <colgroup>
          <col style={{ width: '18%' }} />
          <col style={{ width: '82%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td rowSpan={3} className="cr-logo-cell">
              <ImageWithFallback 
                src={logoImage} 
                alt="Advent" 
                className="w-full max-w-[120px] mx-auto h-auto object-contain" 
              />
            </td>
            <td className="cr-company-name">ADVENT ENERGY PRIVATE LIMITED LAB</td>
          </tr>
          <tr>
            <td className="cr-company-address">A-12, MIDC MALEGAON, SINNAR, NASHIK-422103</td>
          </tr>
          <tr>
            <td>&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {/* Page Info */}
      <table className="cr-page-info-table">
        <colgroup><col style={{ width: '50%' }} /><col style={{ width: '50%' }} /></colgroup>
        <tbody>
          <tr>
            <td></td>
            <td className="cr-right">Page No: 03 of 04</td>
          </tr>
          <tr>
            <td></td>
            <td className="cr-right">TEST REPORT NO: {reportNo}</td>
          </tr>
          <tr>
            <td></td>
            <td className="cr-right">Date:{date}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ height: '12px' }}></div>

      {/* ─── 1. Test of Accuracy ─── */}
      <div className="cr-test-section">
        <div className="cr-test-heading"><strong>1. Test of accuracy:</strong></div>
        <div className="cr-test-subheading">(CI No: 7.3.5 of IS 16227 (Part 3): 2015)</div>
        <div className="cr-test-subheading">Voltage Transformer:</div>
        <div className="cr-test-subheading">RATIO: {ptRatio}, BURDEN: {burden}, CLASS: {accuracyClass}</div>

        <table className="cr-main-table" style={{ marginTop: '6px' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="cr-th" rowSpan={2}>RATIO ERROR IN %<br />BURDEN: 100% AT 0.8 Lag. P.F.</th>
              <th className="cr-th" rowSpan={2}>PHASE ERROR<br />IN %</th>
              <th className="cr-th" rowSpan={2}>% OF<br />RATED<br />VOLTAGE</th>
              <th className="cr-th" colSpan={2}>BURDEN: 25% AT 0.8 Lag. P.F.</th>
              <th className="cr-th" rowSpan={2}>PHASE<br />ERROR IN %</th>
            </tr>
            <tr>
              <th className="cr-th">RATIO<br />ERROR IN %</th>
              <th className="cr-th">PHASE<br />ERROR IN %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="cr-td" style={{ fontWeight: 'bold', textAlign: 'center', background: '#f0f0f0' }}>
                Core I - METERING
              </td>
            </tr>
            {meteringRows.map((row, i) => (
              <tr key={i}>
                <td className="cr-td cr-center">{row.ratioError100}</td>
                <td className="cr-td cr-center">{row.phaseError100}</td>
                <td className="cr-td cr-center">{row.percentage}</td>
                <td className="cr-td cr-center">{row.ratioError25}</td>
                <td className="cr-td cr-center">{row.phaseError25}</td>
                <td className="cr-td cr-center">{row.phaseError25}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cr-remark"><strong>REMARK:</strong> Confirms</div>
      </div>

      {/* ─── 2. Verification of terminal markings ─── */}
      <div className="cr-test-section">
        <div className="cr-test-heading"><strong>2. Verification of terminal markings:</strong></div>
        <div className="cr-test-subheading">(CI No: 7.3.6 of IS 16227 (Part 1): 2016)</div>
        <p className="cr-test-para">Primary winding terminals &nbsp;&nbsp;: {primaryTerminals}</p>
        <p className="cr-test-para">Secondary winding terminals : {secondaryTerminals}</p>
        <p className="cr-test-para">Terminal marking was found OK.</p>
        <p className="cr-test-para">Terminal marking was found marked clearly &amp; indelibly.</p>
        <div className="cr-remark"><strong>REMARK:</strong> Confirms</div>
      </div>

      {/* ─── 3. Dry power frequency withstand test on primary winding ─── */}
      <div className="cr-test-section">
        <div className="cr-test-heading"><strong>3. Dry power frequency withstand test on primary winding:</strong></div>
        <div className="cr-test-subheading">(CI No: 7.3.1.302 of IS 16227 (Part 3): 2015)</div>
        <p className="cr-test-para">
          The test voltage of 3 KV rms was applied between the terminals of the primary winding
          intended to be earthed (N) and earth for the one minute. The tank and all terminals of the
          secondary windings were connected together to the earth.
        </p>
        <p className="cr-test-para">The sample withstood the test voltage satisfactorily.</p>
        <div className="cr-remark"><strong>REMARK:</strong> Confirms</div>
      </div>

      {/* Signature Footer */}
      <table className="cr-sig-table">
        <colgroup>
          <col style={{ width: '33.33%' }} />
          <col style={{ width: '33.33%' }} />
          <col style={{ width: '33.33%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="cr-sig-cell">
              <div className="cr-sig-line"></div>
              <div className="cr-sig-name">Prepared By:<br />{preparedBy}</div>
              <div className="cr-sig-title">({preparedByTitle})</div>
            </td>
            <td className="cr-sig-cell cr-center">
              <div className="cr-sig-line"></div>
              <div className="cr-sig-name">Checked By:<br />{checkedBy}</div>
              <div className="cr-sig-title">({checkedByTitle})</div>
            </td>
            <td className="cr-sig-cell cr-right">
              <div className="cr-sig-line"></div>
              <div className="cr-sig-name">Authorised By:<br />{authorisedBy}</div>
              <div className="cr-sig-title">({authorisedByTitle})</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="cr-qr-footer">QR/AEPL/TC/01</div>
    </div>
  );
}
