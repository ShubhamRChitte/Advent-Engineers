import React from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

interface Page4Props {
  reportNo: string;
  date: string;
  preparedBy: string;
  preparedByTitle: string;
  checkedBy: string;
  checkedByTitle: string;
  authorisedBy: string;
  authorisedByTitle: string;
}

export function Page4FinalRemarks({
  reportNo, date,
  preparedBy, preparedByTitle, checkedBy, checkedByTitle, authorisedBy, authorisedByTitle
}: Page4Props) {
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
            <td className="cr-right">Page No: 04 of 04</td>
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

      {/* ─── 4. Induced overvoltage test ─── */}
      <div className="cr-test-section">
        <div className="cr-test-heading"><strong>4. Induced overvoltage test:</strong></div>
        <div className="cr-test-subheading">(CI No: 7.3.1.303 of IS 16227 (Part 3): 2015)</div>
        <p className="cr-test-para">
          The test was performed by exciting the secondary winding with a voltage of sufficient
          magnitude to induce the specified test voltage of 70 KV rms in the primary winding. The
          test voltage at the high voltage side was measured and recorded. The frequency of the
          exciting voltage was increased to 160 Hz. To prevent core saturation. The test was
          performed for 40 seconds duration.
        </p>
        <p className="cr-test-para">The sample withstood the test voltage satisfactorily.</p>
        <div className="cr-remark"><strong>REMARK:</strong> Confirms</div>
      </div>

      {/* ─── 5. Dry power frequency withstand test on secondary winding ─── */}
      <div className="cr-test-section">
        <div className="cr-test-heading"><strong>5. Dry power frequency withstand test on secondary winding:</strong></div>
        <div className="cr-test-subheading">(CI No: 7.3.4 of IS 16227 (Part 3): 2015)</div>
        <p className="cr-test-para">
          The power frequency voltage of 3 KV (rms) was applied between the secondary winding
          terminals connected together and earth. The primary winding terminals and tank were
          shorted and connected to the earth. The test voltage was applied for one minute.
          There was no disruptive discharge observed.
        </p>
        <p className="cr-test-para">The sample withstood the test voltage satisfactorily.</p>
        <div className="cr-remark"><strong>REMARK:</strong> Confirms</div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {/* Signature Footer */}
        <table className="cr-sig-table" style={{ marginTop: '0' }}>
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

        {/* End of Report */}
        <div className="cr-end-report" style={{ textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>***End of Test Report***</div>

        <div className="cr-qr-footer">QR/AEPL/TC/01</div>
      </div>
    </div>
  );
}
