import React from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

interface Page2Props {
  reportNo: string;
  date: string;
  preparedBy: string;
  preparedByTitle: string;
  checkedBy: string;
  checkedByTitle: string;
  authorisedBy: string;
  authorisedByTitle: string;
}

const TEST_DETAILS = [
  { sr: 1, test: 'Test of accuracy',                                      ref: 'CI No: 7.3.5 of IS 16227 (Part 3): 2015' },
  { sr: 2, test: 'Verification of terminal marking',                       ref: 'CI No: 7.3.6 of IS 16227 (Part 1): 2016' },
  { sr: 3, test: 'Dry power frequency withstand test on primary winding',   ref: 'CI No: 7.3.1.302 of IS 16227 (Part 3): 2015' },
  { sr: 4, test: 'Induced overvoltage test',                               ref: 'CI No: 7.3.1.303 of IS 16227 (Part 3): 2015' },
  { sr: 5, test: 'Dry power frequency withstand test on secondary winding', ref: 'CI No: 7.3.4 of IS 16227 (Part 3): 2015' },
];

export function Page2TestDetails({
  reportNo, date,
  preparedBy, preparedByTitle, checkedBy, checkedByTitle, authorisedBy, authorisedByTitle
}: Page2Props) {
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
            <td className="cr-right">Page No: 02 of 04</td>
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

      <div style={{ height: '24px' }}></div>

      {/* Section Title */}
      <div className="cr-section-title">TEST DETAILS &amp; TEST SPECIFICATION:</div>

      {/* Test Table */}
      <table className="cr-main-table" style={{ marginTop: '10px' }}>
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '54%' }} />
          <col style={{ width: '38%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="cr-th">Sr. No</th>
            <th className="cr-th">Tests</th>
            <th className="cr-th">Reference Standard</th>
          </tr>
        </thead>
        <tbody>
          {TEST_DETAILS.map(row => (
            <tr key={row.sr}>
              <td className="cr-td cr-center">{row.sr}</td>
              <td className="cr-td">{row.test}</td>
              <td className="cr-td">{row.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Spacer to push sig to bottom */}
      <div style={{ flexGrow: 1, minHeight: '280px' }}></div>

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
