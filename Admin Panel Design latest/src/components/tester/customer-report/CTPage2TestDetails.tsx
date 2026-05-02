import React from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

import { Edit2, Save } from 'lucide-react';
import { Button } from '../../ui/button';

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

const INITIAL_TEST_DETAILS = [
  { sr: 1, test: 'Verification of terminal marking', ref: 'CI No: 7.3.6 of IS 16227 (Part 1): 2016' },
  { sr: 2, test: 'Dry power frequency withstand test on primary winding', ref: 'CI No: 7.3.1 of IS 16227 (Part 1): 2016' },
  { sr: 3, test: 'Dry power frequency withstand test on secondary winding', ref: 'CI No: 7.3.4 of IS 16227 (Part 1): 2016' },
  { sr: 4, test: 'Test for accuracy', ref: 'CI No: 7.2.6 of IS 16227 (Part 2): 2016' },
  { sr: 5, test: 'Inter-turn over voltage test', ref: 'CI No: 7.3.204 of IS 16227 (Part 2): 2016' },
];

export function CTPage2TestDetails(props: Page2Props) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [testDetails, setTestDetails] = React.useState(INITIAL_TEST_DETAILS);
  const [reportInfo, setReportInfo] = React.useState({
    reportNo: props.reportNo,
    date: props.date
  });

  React.useEffect(() => {
    setReportInfo({ reportNo: props.reportNo, date: props.date });
  }, [props.reportNo, props.date]);

  const handleDetailChange = (index: number, field: 'test' | 'ref', value: string) => {
    const newDetails = [...testDetails];
    newDetails[index][field] = value;
    setTestDetails(newDetails);
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid #ddd',
    padding: '2px 4px',
    fontSize: '11px',
    fontFamily: 'inherit',
    background: '#f9f9f9'
  };

  return (
    <div className="ct-page" style={{ position: 'relative' }}>
      {/* Edit Toggle Button */}
      <div className="no-print" style={{ position: 'absolute', top: '-40px', right: '0', zIndex: 100 }}>
        <Button 
          variant={isEditing ? "success" : "outline"} 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2 shadow-md"
        >
          {isEditing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit2 className="w-4 h-4" /> Edit Table</>}
        </Button>
      </div>

      {/* Header */}
      <table className="ct-header-table">
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '85%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="ct-logo-cell">
              <ImageWithFallback src={logoImage} alt="Advent" className="w-[80px] h-auto" />
            </td>
            <td>
              <div className="ct-company-name">ADVENT ENERGY PRIVATE LIMITED LAB</div>
              <div className="ct-company-address">A-12, MIDC MALEGAON, SINNAR, NASHIK-422103</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="ct-report-title" style={{ marginTop: '20px' }}>TEST DETAILS & TEST SPECIFICATION</div>

      <table className="ct-page-info-table">
        <tbody>
          <tr>
            <td className="ct-right">Page No: 02 of 03</td>
          </tr>
          <tr>
            <td className="ct-right">
              TEST REPORT NO: {isEditing ? (
                <input style={inputStyle} value={reportInfo.reportNo} onChange={(e) => setReportInfo(prev => ({ ...prev, reportNo: e.target.value }))} />
              ) : reportInfo.reportNo}
            </td>
          </tr>
          <tr>
            <td className="ct-right">
              Date: {isEditing ? (
                <input style={{ ...inputStyle, width: '100px' }} value={reportInfo.date} onChange={(e) => setReportInfo(prev => ({ ...prev, date: e.target.value }))} />
              ) : reportInfo.date}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="ct-main-table" style={{ marginTop: '20px' }}>
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '45%' }} />
          <col style={{ width: '45%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="ct-th">Sr. No</th>
            <th className="ct-th">Tests</th>
            <th className="ct-th">Reference Standard</th>
          </tr>
        </thead>
        <tbody>
          {testDetails.map((row, idx) => (
            <tr key={row.sr}>
              <td className="ct-td ct-center">{row.sr}</td>
              <td className="ct-td">
                {isEditing ? (
                  <input style={inputStyle} value={row.test} onChange={(e) => handleDetailChange(idx, 'test', e.target.value)} />
                ) : row.test}
              </td>
              <td className="ct-td">
                {isEditing ? (
                  <input style={inputStyle} value={row.ref} onChange={(e) => handleDetailChange(idx, 'ref', e.target.value)} />
                ) : row.ref}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature Section */}
      <div style={{ marginTop: 'auto' }}>
        <table className="ct-sig-table">
          <tbody>
            <tr>
              <td className="ct-sig-cell">
                <div className="ct-sig-line"></div>
                <strong>Prepared By:</strong><br />
                {props.preparedBy}<br />
                ({props.preparedByTitle})
              </td>
              <td className="ct-sig-cell">
                <div className="ct-sig-line"></div>
                <strong>Checked By:</strong><br />
                {props.checkedBy}<br />
                ({props.checkedByTitle})
              </td>
              <td className="ct-sig-cell">
                <div className="ct-sig-line"></div>
                <strong>Authorised By:</strong><br />
                {props.authorisedBy}<br />
                ({props.authorisedByTitle})
              </td>
            </tr>
          </tbody>
        </table>
        <div className="ct-qr-footer">QR/AEPL/TC/01</div>
      </div>
    </div>
  );
}
