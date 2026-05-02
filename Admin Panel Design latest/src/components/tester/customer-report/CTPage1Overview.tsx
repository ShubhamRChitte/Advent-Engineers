import React, { useState } from 'react';
import logoImage from 'figma:asset/9d5dbd3020690d903579eb3ff66bac216cd36f83.png';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Edit2, Save } from 'lucide-react';
import { Button } from '../../ui/button';

interface Page1Props {
  reportNo: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerRef: string;
  receiptDate: string;
  tsrfNo: string;
  sampleIdNo: string;
  productName: string;
  ratedVoltage: string;
  stc: string;
  ctRatio: string;
  ctSpecification: string;
  bil: string;
  srNo: string;
  make: string;
  drgNo: string;
  preparedBy: string;
  preparedByTitle: string;
  checkedBy: string;
  checkedByTitle: string;
  authorisedBy: string;
  authorisedByTitle: string;
}

export function CTPage1Overview(props: Page1Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...props });

  // Update formData if props change
  React.useEffect(() => {
    setFormData({ ...props });
  }, [props]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const {
    reportNo, date, customerName, customerAddress, customerRef,
    receiptDate, tsrfNo, sampleIdNo, productName, ratedVoltage,
    stc, ctRatio, ctSpecification, bil, srNo, make, drgNo,
    preparedBy, preparedByTitle, checkedBy, checkedByTitle, authorisedBy, authorisedByTitle
  } = formData;

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
      {/* Edit Toggle Button - Hidden in Print */}
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

      <div className="ct-report-title">TEST REPORT</div>

      <table className="ct-page-info-table">
        <tbody>
          <tr>
            <td className="ct-right">Page No: 01 of 03</td>
          </tr>
          <tr>
            <td className="ct-right">
              TEST REPORT NO: {isEditing ? (
                <input style={inputStyle} value={reportNo} onChange={(e) => handleChange('reportNo', e.target.value)} />
              ) : reportNo}
            </td>
          </tr>
          <tr>
            <td className="ct-right">
              Date: {isEditing ? (
                <input style={{ ...inputStyle, width: '100px' }} value={date} onChange={(e) => handleChange('date', e.target.value)} />
              ) : date}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Main Data Table */}
      <table className="ct-main-table" style={{ marginTop: '5px' }}>
        <colgroup>
          <col style={{ width: '35%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="ct-td ct-label">1.0 Name & Address of Customer</td>
            <td className="ct-td" colSpan={4}>
              {isEditing ? (
                <>
                  <input style={{ ...inputStyle, fontWeight: 'bold', marginBottom: '4px' }} value={customerName} onChange={(e) => handleChange('customerName', e.target.value)} placeholder="Customer Name" />
                  <textarea style={{ ...inputStyle, height: '40px' }} value={customerAddress} onChange={(e) => handleChange('customerAddress', e.target.value)} placeholder="Customer Address" />
                </>
              ) : (
                <><strong>{customerName}</strong><br />{customerAddress}</>
              )}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label">2.0 Customer letter/ Ref No/ DC No:</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={customerRef} onChange={(e) => handleChange('customerRef', e.target.value)} />
              ) : customerRef}
            </td>
            <td className="ct-td ct-label">Date</td>
            <td className="ct-td">
              {isEditing ? (
                <input style={inputStyle} value={date} onChange={(e) => handleChange('date', e.target.value)} />
              ) : date}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label">3.0 Date of receipt.</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={receiptDate} onChange={(e) => handleChange('receiptDate', e.target.value)} />
              ) : receiptDate}
            </td>
            <td className="ct-td ct-label">Condition of test Sample:</td>
            <td className="ct-td">Satisfactory</td>
          </tr>
          <tr>
            <td className="ct-td ct-label">4.0 Date of test</td>
            <td className="ct-td" colSpan={4}>
              {isEditing ? (
                <input style={inputStyle} value={date} onChange={(e) => handleChange('date', e.target.value)} />
              ) : date}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label" rowSpan={8}>5.0 Description of test sample</td>
            <td className="ct-td ct-label" colSpan={2}>TSRF No</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={tsrfNo} onChange={(e) => handleChange('tsrfNo', e.target.value)} />
              ) : tsrfNo}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label" colSpan={2}>AEPL Sample ID No</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={sampleIdNo} onChange={(e) => handleChange('sampleIdNo', e.target.value)} />
              ) : sampleIdNo}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label" colSpan={2}>Name of Product</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={productName} onChange={(e) => handleChange('productName', e.target.value)} />
              ) : productName}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label">Rated Voltage</td>
            <td className="ct-td">
              {isEditing ? (
                <input style={inputStyle} value={ratedVoltage} onChange={(e) => handleChange('ratedVoltage', e.target.value)} />
              ) : ratedVoltage}
            </td>
            <td className="ct-td ct-label">Frequency</td>
            <td className="ct-td">50 HZ</td>
          </tr>
          <tr>
            <td className="ct-td ct-label">STC</td>
            <td className="ct-td">
              {isEditing ? (
                <input style={inputStyle} value={stc} onChange={(e) => handleChange('stc', e.target.value)} />
              ) : stc}
            </td>
            <td className="ct-td ct-label">Year of Mfg.</td>
            <td className="ct-td">2026</td>
          </tr>
          <tr>
            <td className="ct-td ct-label">CT Ratio</td>
            <td className="ct-td">
              {isEditing ? (
                <input style={inputStyle} value={ctRatio} onChange={(e) => handleChange('ctRatio', e.target.value)} />
              ) : ctRatio}
            </td>
            <td className="ct-td ct-label">ISF</td>
            <td className="ct-td">-</td>
          </tr>
          <tr>
            <td className="ct-td ct-label" colSpan={2}>CT Specification</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={ctSpecification} onChange={(e) => handleChange('ctSpecification', e.target.value)} />
              ) : ctSpecification}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label" colSpan={2}>B. I. L</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={bil} onChange={(e) => handleChange('bil', e.target.value)} />
              ) : bil}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label" rowSpan={2}>6.0 Sample Identification</td>
            <td className="ct-td ct-label" colSpan={2}>Sr. No</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={srNo} onChange={(e) => handleChange('srNo', e.target.value)} />
              ) : srNo}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label" colSpan={2}>Make</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={make} onChange={(e) => handleChange('make', e.target.value)} />
              ) : make}
            </td>
          </tr>
          <tr>
            <td className="ct-td ct-label">7.0 Test Method</td>
            <td className="ct-td" colSpan={4}>AS Per IS 16227:2016</td>
          </tr>
          <tr>
            <td className="ct-td ct-label">8.0 Details of test</td>
            <td className="ct-td" colSpan={4}>AS Per Sheet No-02</td>
          </tr>
          <tr>
            <td className="ct-td ct-label">9.0 Test Witnessed by</td>
            <td className="ct-td" colSpan={4}>----------</td>
          </tr>
          <tr>
            <td className="ct-td ct-label">10.0 Enclosure</td>
            <td className="ct-td ct-label" colSpan={2}>Drg No.</td>
            <td className="ct-td" colSpan={2}>
              {isEditing ? (
                <input style={inputStyle} value={drgNo} onChange={(e) => handleChange('drgNo', e.target.value)} />
              ) : drgNo}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="ct-remark" style={{ marginTop: '10px' }}>
        Remarks: The Sample conforms to the requirements of the mentioned standard as mentioned in test Sr no 1 to 3 on sheet no: 02
      </div>

      <div className="ct-notes-block">
        <strong>Note:</strong>
        <ol style={{ listStyleType: 'decimal', paddingLeft: '24px', margin: '5px 0' }}>
          <li>This report relates only to the particular sample received in good condition for testing at AEPL, Sinnar</li>
          <li>This report cannot be reproduced in part under any circumstances.</li>
          <li>Publication of this report requires prior permission in writing from CEO, AEPL.</li>
          <li>Only tests asked for by the customer have been carried out.</li>
          <li>In case of any dispute, AEPL will be the exclusive jurisdiction & shall be construed as where the cause has arisen</li>
          <li>Any Error in this report should be brought in our notice within 30 days from the date of issue of this report.</li>
        </ol>
      </div>

      <div className="ct-caution-block" style={{ fontSize: '10.5px' }}>
        <strong>Caution:</strong><br />
        AEPL is not responsible for the authenticity of photocopied or reproduced test reports.<br />
        AEPL provides support to customers for verification of the authenticity of test reports issued by AEPL.
      </div>

      {/* Signature Section */}
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
  );
}
