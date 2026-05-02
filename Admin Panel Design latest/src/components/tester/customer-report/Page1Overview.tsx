import React from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

interface Page1Props {
  reportNo: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerRef: string;
  receiptDate: string;
  testDate: string;
  tsrfNo: string;
  sampleIdNo: string;
  productName: string;
  ratedVoltage: string;
  vf: string;
  yearOfMfg: string;
  ptRatio: string;
  ptSpecification: string;
  bll: string;
  srNo: string;
  make: string;
  testMethod: string;
  detailsOfTest: string;
  testedBy: string;
  enclosure: string;
  ambientTemp: string;
  conditionOfSample: string;
  preparedBy: string;
  preparedByTitle: string;
  checkedBy: string;
  checkedByTitle: string;
  authorisedBy: string;
  authorisedByTitle: string;
}

export function Page1Overview({
  reportNo, date, customerName, customerAddress, customerRef,
  receiptDate, testDate, tsrfNo, sampleIdNo, productName,
  ratedVoltage, vf, yearOfMfg, ptRatio, ptSpecification, bll,
  srNo, make, testMethod, detailsOfTest, testedBy, enclosure,
  ambientTemp, conditionOfSample,
  preparedBy, preparedByTitle, checkedBy, checkedByTitle, authorisedBy, authorisedByTitle
}: Page1Props) {
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
            <td className="cr-report-title">TEST REPORT</td>
          </tr>
        </tbody>
      </table>

      {/* Page Info */}
      <table className="cr-page-info-table">
        <colgroup><col style={{ width: '50%' }} /><col style={{ width: '50%' }} /></colgroup>
        <tbody>
          <tr>
            <td></td>
            <td className="cr-right">Page No: 01 of 04</td>
          </tr>
          <tr>
            <td></td>
            <td className="cr-right">TEST REPORT NO: {reportNo}</td>
          </tr>
        </tbody>
      </table>

      {/* Date */}
      <div className="cr-date-row">Date:{date}</div>

      {/* Main Details Table */}
      <table className="cr-main-table">
        <colgroup>
          <col style={{ width: '32%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="cr-label">1.0 Name &amp; Address of Customer</td>
            <td colSpan={4} className="cr-value">{customerName}<br />{customerAddress}</td>
          </tr>
          <tr>
            <td className="cr-label">2.0 Customer letter/ Ref No/ DC No:</td>
            <td colSpan={2} className="cr-value">{customerRef}</td>
            <td className="cr-label">Date</td>
            <td className="cr-value">{date}</td>
          </tr>
          <tr>
            <td className="cr-label">3.0 Date of receipt.</td>
            <td colSpan={2} className="cr-value">{receiptDate}</td>
            <td className="cr-label">Condition of<br/>test Sample:</td>
            <td className="cr-value">{conditionOfSample}</td>
          </tr>
          <tr>
            <td className="cr-label">4.0 Date of test</td>
            <td colSpan={4} className="cr-value">{testDate}</td>
          </tr>
          <tr>
            <td className="cr-label" rowSpan={8}>5.0 Description of test sample</td>
            <td className="cr-label">TSRF No</td>
            <td colSpan={3} className="cr-value">{tsrfNo}</td>
          </tr>
          <tr>
            <td className="cr-label">AEPL Sample ID No</td>
            <td colSpan={3} className="cr-value">{sampleIdNo}</td>
          </tr>
          <tr>
            <td className="cr-label">Name of Product</td>
            <td colSpan={3} className="cr-value">{productName}</td>
          </tr>
          <tr>
            <td className="cr-label">Rated Voltage</td>
            <td className="cr-value">{ratedVoltage}</td>
            <td className="cr-label">Frequency</td>
            <td className="cr-value">50 HZ</td>
          </tr>
          <tr>
            <td className="cr-label">V. F</td>
            <td className="cr-value">{vf}</td>
            <td className="cr-label">Year of<br/>Mfg.</td>
            <td className="cr-value">{yearOfMfg}</td>
          </tr>
          <tr>
            <td className="cr-label">PT Ratio</td>
            <td colSpan={3} className="cr-value">{ptRatio}</td>
          </tr>
          <tr>
            <td className="cr-label">PT Specification</td>
            <td colSpan={3} className="cr-value">{ptSpecification}</td>
          </tr>
          <tr>
            <td className="cr-label">B. I. L</td>
            <td colSpan={3} className="cr-value">{bll}</td>
          </tr>
          <tr>
            <td className="cr-label" rowSpan={2}>6.0 Sample Identification</td>
            <td className="cr-label">Sr. No</td>
            <td colSpan={3} className="cr-value">{srNo}</td>
          </tr>
          <tr>
            <td className="cr-label">Make</td>
            <td colSpan={3} className="cr-value">{make}</td>
          </tr>
          <tr>
            <td className="cr-label">7.0 Test Method</td>
            <td colSpan={4} className="cr-value">{testMethod}</td>
          </tr>
          <tr>
            <td className="cr-label">8.0 Details of test</td>
            <td colSpan={4} className="cr-value">{detailsOfTest}</td>
          </tr>
          <tr>
            <td className="cr-label">9.0 Test Witnessed by</td>
            <td colSpan={4} className="cr-value">{testedBy || '----------'}</td>
          </tr>
          <tr>
            <td className="cr-label">10.0 Enclosure</td>
            <td className="cr-label">Drg No.</td>
            <td colSpan={3} className="cr-value">{enclosure}</td>
          </tr>
          <tr>
            <td className="cr-label">11.0 Ambient temperature/Humidity</td>
            <td colSpan={4} className="cr-value">{ambientTemp}</td>
          </tr>
        </tbody>
      </table>

      {/* Remarks */}
      <div className="cr-remarks-block">
        <p><strong>Remarks:</strong> The Sample conforms to the requirements of the mentioned standard as mentioned in test Sr No 1 to 4 on sheet no: 02</p>
      </div>

      {/* Notes */}
      <div className="cr-notes-block">
        <p><strong>Note:</strong></p>
        <ol>
          <li>This report relates only to the particular sample received in good condition for testing at AEPL, Sinnar</li>
          <li>This report cannot be reproduced in part under any circumstances.</li>
          <li>Publication of this report requires prior permission in writing from CEO, AEPL.</li>
          <li>Only tests asked for by the customer have been carried out.</li>
          <li>In case of any dispute, AEPL will be the exclusive jurisdiction &amp; shall be construed as where the cause has arisen</li>
          <li>Any Error in this report should be brought in our notice within 30 days from the date of issue of this report.</li>
          <li>The laboratory is responsible for all the information provided in the result except when information is provided by the customer.</li>
        </ol>
      </div>

      {/* Caution */}
      <div className="cr-caution-block">
        <p><strong>Caution:</strong></p>
        <p>AEPL is not responsible for the authenticity of photocopied or reproduced test reports.</p>
        <p>AEPL provides support to customers for verification of the authenticity of test reports issued by AEPL.</p>
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
