import React from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

import { Edit2, Save } from 'lucide-react';
import { Button } from '../../ui/button';

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
  ctRatio: string;
  burden: string;
  accuracyClass: string;
  reportData: any;
  preparedBy: string;
  preparedByTitle: string;
  checkedBy: string;
  checkedByTitle: string;
  authorisedBy: string;
  authorisedByTitle: string;
}

export function CTPage3Results(props: Page3Props) {
  const [isEditing, setIsEditing] = React.useState(false);
  const meteringAcc = props.reportData?.accuracyTest?.metering || {};
  const [accuracyRows, setAccuracyRows] = React.useState<AccuracyRow[]>(() => 
    ['120', '100', '20', '5', '1'].map(pct => ({
      percentage: pct,
      ratioError100: meteringAcc[pct]?.ratioError100 || '-',
      phaseError100: meteringAcc[pct]?.phaseError100 || '-',
      ratioError25: meteringAcc[pct]?.ratioError25 || '-',
      phaseError25: meteringAcc[pct]?.phaseError25 || '-',
    }))
  );

  const [reportInfo, setReportInfo] = React.useState({
    reportNo: props.reportNo,
    date: props.date,
    ctRatio: props.ctRatio,
    burden: props.burden,
    accuracyClass: props.accuracyClass
  });

  React.useEffect(() => {
    setReportInfo({
      reportNo: props.reportNo,
      date: props.date,
      ctRatio: props.ctRatio,
      burden: props.burden,
      accuracyClass: props.accuracyClass
    });
  }, [props.reportNo, props.date, props.ctRatio, props.burden, props.accuracyClass]);

  const handleRowChange = (index: number, field: keyof AccuracyRow, value: string) => {
    const newRows = [...accuracyRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setAccuracyRows(newRows);
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

      <table className="ct-page-info-table" style={{ marginTop: '10px' }}>
        <tbody>
          <tr>
            <td className="ct-right">Page No: 03 of 03</td>
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

      {/* 1. Verification of terminal Marking */}
      <div className="ct-test-section">
        <div className="ct-test-heading"><strong>1. Verification of terminal Marking:</strong> (CI No: 7.3.6 of IS 16227 (Part 1): 2016)</div>
        <div className="ct-test-para" style={{ marginLeft: '15px' }}>
          Primary winding terminals: P1-P2<br />
          Secondary winding terminal: S1-S2<br />
          Terminal marking was found OK<br />
          Terminal marking was found marked clearly and indelibly
        </div>
        <div className="ct-remark">REMARK: Confirms</div>
      </div>

      {/* 2. Dry Power frequency withstand test on primary winding */}
      <div className="ct-test-section">
        <div className="ct-test-heading"><strong>2. Dry Power frequency withstand test on primary winding:</strong> (CI No: 7.3.1 of IS 16227 (Part 1): 2016)</div>
        <div className="ct-test-para" style={{ marginLeft: '15px' }}>
          The power frequency voltage of 28KV (rms) was applied between the primary winding terminals & earth,
          for one minute duration. The secondary winding terminals & base plate were connected together to earth.
          The sample withstood the test voltage without any disruptive discharge.
        </div>
        <div className="ct-remark">REMARK: Confirms</div>
      </div>

      {/* 3. Dry power frequency withstand test on secondary winding */}
      <div className="ct-test-section">
        <div className="ct-test-heading"><strong>3. Dry power frequency withstand test on secondary winding:</strong> (CI No: 7.3.4 of IS 16227 (Part 1): 2016)</div>
        <div className="ct-test-para" style={{ marginLeft: '15px' }}>
          The power frequency voltage of 3KV (rms) was applied between the secondary winding terminals, for one
          minute duration. The primary windings terminals & base plate were connected together to earth. The sample
          withstood the test voltage without any disruptive discharge.
        </div>
        <div className="ct-remark">REMARK: Confirms</div>
      </div>

      {/* 4. Test for accuracy */}
      <div className="ct-test-section">
        <div className="ct-test-heading"><strong>4. Test for accuracy:</strong> CI No: 7.2.6 of IS 16227 (Part 2): 2016</div>
        <div className="ct-test-subheading">A. Test for ratio error and phase displacement of measuring current transformer</div>
        <div className="ct-test-subheading">
          {isEditing ? (
            <div className="flex gap-4">
              <span>RATIO: <input style={{ ...inputStyle, width: '60px' }} value={reportInfo.ctRatio} onChange={(e) => setReportInfo(prev => ({ ...prev, ctRatio: e.target.value }))} /></span>
              <span>BURDEN: <input style={{ ...inputStyle, width: '60px' }} value={reportInfo.burden} onChange={(e) => setReportInfo(prev => ({ ...prev, burden: e.target.value }))} /></span>
              <span>CLASS: <input style={{ ...inputStyle, width: '60px' }} value={reportInfo.accuracyClass} onChange={(e) => setReportInfo(prev => ({ ...prev, accuracyClass: e.target.value }))} /></span>
            </div>
          ) : (
            <>RATIO: {reportInfo.ctRatio}, BURDEN: {reportInfo.burden}, CLASS: {reportInfo.accuracyClass}, Secondary winding terminals: S1-S2</>
          )}
        </div>

        <table className="ct-main-table" style={{ marginTop: '5px' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="ct-th">RATIO<br />ERROR (%)</th>
              <th className="ct-th">PHASE ANGLE<br />ERROR (Min.)</th>
              <th className="ct-th">% OF RATED<br />PRIMARY<br />CURRENT</th>
              <th className="ct-th">RATIO<br />ERROR (%)</th>
              <th className="ct-th">PHASE ANGLE<br />ERROR (Min.)</th>
            </tr>
            <tr>
              <th className="ct-th" colSpan={2}>BURDEN:100% AT 0.8 Lag. P. F.</th>
              <th className="ct-th"></th>
              <th className="ct-th" colSpan={2}>BURDEN: 25% AT U. P. F.</th>
            </tr>
          </thead>
          <tbody>
            {accuracyRows.map((row, idx) => (
              <tr key={idx}>
                <td className="ct-td ct-center">
                  {isEditing ? <input style={inputStyle} value={row.ratioError100} onChange={(e) => handleRowChange(idx, 'ratioError100', e.target.value)} /> : row.ratioError100}
                </td>
                <td className="ct-td ct-center">
                  {isEditing ? <input style={inputStyle} value={row.phaseError100} onChange={(e) => handleRowChange(idx, 'phaseError100', e.target.value)} /> : row.phaseError100}
                </td>
                <td className="ct-td ct-center">{row.percentage}</td>
                <td className="ct-td ct-center">
                  {isEditing ? <input style={inputStyle} value={row.ratioError25} onChange={(e) => handleRowChange(idx, 'ratioError25', e.target.value)} /> : row.ratioError25}
                </td>
                <td className="ct-td ct-center">
                  {isEditing ? <input style={inputStyle} value={row.phaseError25} onChange={(e) => handleRowChange(idx, 'phaseError25', e.target.value)} /> : row.phaseError25}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ct-remark">REMARK: Confirms</div>
      </div>

      {/* 5. Inter-turn over voltage test */}
      <div className="ct-test-section">
        <div className="ct-test-heading"><strong>5. Inter-turn over voltage test:</strong> (CI No: 7.3.204 of IS 16227 (Part 2): 2016)</div>
        <div className="ct-test-para" style={{ marginLeft: '15px' }}>
          With secondary winding connected to oscilloscope, a substantially sinusoidal current at 50 HZ frequency &
          of rms value equal to rated primary current (i.e. 200A) was applied for 60 seconds to the primary winding.
          The sample withstood the test voltage for secondary terminals (i.e S1-S2) of secondary side for 60 sec.
        </div>
        <div className="ct-remark">REMARK: Confirms</div>
      </div>

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

        <div className="ct-end-report" style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>***End of Test Report***</div>
        <div className="ct-qr-footer">QR/AEPL/TC/01</div>
      </div>
    </div>
  );
}
