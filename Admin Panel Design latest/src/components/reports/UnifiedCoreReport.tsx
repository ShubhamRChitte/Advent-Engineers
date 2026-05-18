/**
 * UnifiedCoreReport.tsx
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SINGLE SOURCE OF TRUTH — CORE TESTING REPORT RENDERER     ║
 * ║                                                              ║
 * ║  ALL report views, previews, prints, and downloads MUST     ║
 * ║  render through this component. No other report rendering   ║
 * ║  engine should exist.                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Architecture:
 * - ONE single <table> from title banner through data rows
 * - <colgroup> defines fixed column widths for the entire grid
 * - All spec rows, header rows, and data rows share the same column grid
 * - This guarantees pixel-perfect alignment across all sections
 *
 * Matches original scanned Excel report sheets exactly.
 */

import { REPORT_THEME } from '../../utils/reportTheme';
import type { UnifiedCoreReportData } from '../../utils/reportDataAdapter';
import adventLogo from '../../assets/advent_logo.jpg';
import { ReportCanvas } from './ReportCanvas';
import './UnifiedCoreReport.css';

export interface UnifiedCoreReportProps {
  data: UnifiedCoreReportData;
}

/**
 * Compute fixed column width percentages based on column count.
 * Returns an array of width strings like ['9%', '14%', ...].
 */
function computeColumnWidths(bsatCount: number): string[] {
  // Column count varies based on dynamic BSAT requirements.

  if (bsatCount <= 1) {
    // Protection/PS layout (4-5 columns)
    // Date=10%, Vendor=20%, Internal=22%, Value=28%, Remark=20%
    const widths = ['10%', '20%', '22%'];
    const valueWidth = Math.floor(28 / Math.max(1, bsatCount));
    for (let i = 0; i < bsatCount; i++) widths.push(valueWidth + '%');
    widths.push('20%');
    return widths;
  }

  // Metering layout (7-8+ columns)
  // Date=9%, Vendor=13%, Internal=14%, each BSAT=dynamic, Remark=12%
  const fixedWidth = 9 + 13 + 14 + 12; // = 48%
  const remainingWidth = 100 - fixedWidth; // = 52%
  const perBsat = Math.floor((remainingWidth / bsatCount) * 10) / 10;

  const widths = ['9%', '13%', '14%'];
  for (let i = 0; i < bsatCount; i++) widths.push(perBsat + '%');
  widths.push('12%');
  return widths;
}

export function UnifiedCoreReport({ data }: UnifiedCoreReportProps) {
  if (!data || (!data.orderId && !data.clientName && data.rows.length === 0 && data.bsatColumns.length === 0)) {
    return null;
  }

  const N = data.bsatColumns.length; // Number of dynamic columns
  const colWidths = computeColumnWidths(N);
  const isProtection = data.coreType === 'Protection' || data.coreType === 'PS';

  // Empty rows to fill A4 height
  const emptyRowCount = Math.max(0, REPORT_THEME.minDataRows - data.rows.length);

  return (
    <ReportCanvas id="print-section">
        <div className="ucr-page-content">
          {/* ═══════ HEADER (outside table) ═══════ */}
          <div className="ucr-header">
            <div className="ucr-header-logo">
              <img src={adventLogo} alt="Advent Engineers Logo" />
            </div>
            <div className="ucr-header-center">
              <div className="ucr-company-name">ADVENT ENGINEERS</div>
              <div className="ucr-company-sub">Excellence in Transformer Core Testing</div>
            </div>
            <div className="ucr-header-spacer"></div>
          </div>

          {/* ═══════ METADATA (outside table) ═══════ */}
          <div className="ucr-meta">
            <div className="ucr-meta-col">
              <div className="ucr-meta-row">
                <div className="ucr-meta-label">Date:</div>
                <div className="ucr-meta-value">{data.reportDate}</div>
              </div>
              <div className="ucr-meta-row">
                <div className="ucr-meta-label">Order No:</div>
                <div className="ucr-meta-value">{data.orderId}</div>
              </div>
              <div className="ucr-meta-row">
                <div className="ucr-meta-label">Client:</div>
                <div className="ucr-meta-value">{data.clientName}</div>
              </div>
            </div>
            <div className="ucr-meta-col">
              <div className="ucr-meta-row">
                <div className="ucr-meta-label">Batch ID:</div>
                <div className="ucr-meta-value">{data.batchId}</div>
              </div>
              {data.tataRef && (
                <div className="ucr-meta-row">
                  <div className="ucr-meta-label">Tata Ref:</div>
                  <div className="ucr-meta-value">{data.tataRef}</div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              SINGLE MONOLITHIC TABLE
              All sections share the same column grid.
              ══════════════════════════════════════════════════ */}
          <table className="ucr-master-table">
            {/* Fixed column widths via colgroup */}
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>

            <tbody>
              {/* ──── ROW 1: Title Banner ──── */}
              <tr>
                <td colSpan={3} className="ucr-cell-banner-orange">
                  Toroidal Core Testing
                </td>
                <td colSpan={N + 1} className="ucr-cell-material">
                  {data.materialType}
                </td>
              </tr>

              {/* ──── ROW 2: Description ──── */}
              <tr>
                <td colSpan={3} className="ucr-cell-banner-blue">
                  Description-
                </td>
                <td colSpan={N + 1} className="ucr-cell-material">
                  {data.materialType}
                </td>
              </tr>

              {/* ──── ROW 3: Core Size ──── */}
              {N >= 3 ? (
                <tr>
                  <td colSpan={3} className="ucr-cell-green">CORE SIZE IN MM-</td>
                  <td className="ucr-cell-value">{data.coreSize.id}</td>
                  <td className="ucr-cell-value">{data.coreSize.od}</td>
                  <td className="ucr-cell-value">{data.coreSize.ht}</td>
                  {/* Remaining BSAT cols + remark = (N-3) + 1 */}
                  <td colSpan={N - 3 + 1} className="ucr-cell-green-center">ID-OD-HT</td>
                </tr>
              ) : (
                <tr>
                  <td className="ucr-cell-green">CORE SIZE IN MM-</td>
                  <td className="ucr-cell-value">{data.coreSize.id}</td>
                  <td className="ucr-cell-value">{data.coreSize.od}</td>
                  <td className="ucr-cell-value">{data.coreSize.ht}</td>
                  {/* Fill remaining */}
                  {N > 0 && Array.from({ length: N - 1 }).map((_, i) => (
                    <td key={`cs-pad-${i}`} className="ucr-cell-value"></td>
                  ))}
                  <td className="ucr-cell-green-center">ID-OD-HT</td>
                </tr>
              )}

              {/* ──── ROW 4: Turn Used ──── */}
              <tr>
                <td colSpan={3} className="ucr-cell-yellow">TURN USED FOR TESTING-</td>
                <td colSpan={N + 1} className="ucr-cell-value">
                  {data.turnsUsed} {parseInt(data.turnsUsed) === 1 ? 'TURN' : 'TURNS'}
                </td>
              </tr>

              {/* ──── ROW 5: Specification + Area ──── */}
              <tr>
                <td colSpan={2} rowSpan={2} className="ucr-cell-spec-label">
                  Specification
                </td>
                <td className="ucr-cell-sublabel">Area (Sq cm)</td>
                <td colSpan={N + 1} className="ucr-cell-value">{data.areaSqCm}</td>
              </tr>

              {/* ──── ROW 6: MMP ──── */}
              <tr>
                <td className="ucr-cell-sublabel">MMP (cm)</td>
                <td colSpan={N + 1} className="ucr-cell-value">{data.mmp}</td>
              </tr>

              {/* ──── ROW 7: BSAT(G) / B (Flux) ──── */}
              <tr>
                <td colSpan={3} className="ucr-cell-bsat-label">
                  {isProtection ? 'B (Flux in Tesla)' : 'BSAT(G)'}
                </td>
                {data.bsatColumns.map(col => (
                  <td key={`bsat-${col.id}`} className="ucr-cell-bsat-value">
                    {col.bsatValue}
                  </td>
                ))}
                <td className="ucr-cell-value"></td>
              </tr>

              {/* ──── ROW 8: SET mV / Voltage ──── */}
              <tr>
                <td colSpan={3} className="ucr-cell-setmv-label">
                  {isProtection ? 'Voltage (V)' : 'SET mV'}
                </td>
                {data.bsatColumns.map(col => (
                  <td key={`setmv-${col.id}`} className="ucr-cell-setmv-value">
                    {col.setMvValue}
                  </td>
                ))}
                <td className="ucr-cell-value"></td>
              </tr>

              {/* ──── ROW 9: LE LIMIT / Iex limit ──── */}
              <tr>
                <td colSpan={3} className="ucr-cell-le-label">
                  {isProtection ? 'Iex limit (mA)' : 'LE LIMIT in mA.'}
                </td>
                {data.bsatColumns.map(col => (
                  <td key={`le-${col.id}`} className="ucr-cell-le-value">
                    {col.leLimitValue}
                  </td>
                ))}
                <td className="ucr-cell-value"></td>
              </tr>

              {/* ──── ROW 10: Column Headers (data section) ──── */}
              <tr>
                <td className="ucr-cell-col-header">Date</td>
                <td className="ucr-cell-col-header">
                  {isProtection ? 'Core Vendor No' : 'Vendor core No.'}
                </td>
                <td className="ucr-cell-col-header">Internal core No.</td>
                {data.bsatColumns.map(col => (
                  <td key={`dh-${col.id}`} className="ucr-cell-col-header-bsat">
                    {isProtection ? 'Value' : col.bsatValue}
                  </td>
                ))}
                <td className="ucr-cell-col-header">
                  {isProtection ? 'P/F' : 'Remark'}
                </td>
              </tr>

              {/* ──── DATA ROWS ──── */}
              {data.rows.map((row, index) => (
                <tr key={index}>
                  <td className="ucr-cell-data">{row.date}</td>
                  <td className="ucr-cell-data">{row.vendorCoreNo}</td>
                  <td className="ucr-cell-data-bold">{row.internalCoreNo}</td>
                  {data.bsatColumns.map(col => (
                    <td key={`v-${col.id}-${index}`} className="ucr-cell-data">
                      {row.dynamicValues?.[col.id] || '-'}
                    </td>
                  ))}
                  <td className={`ucr-cell-data ${
                    row.remark === 'P' || row.remark === 'Pass' ? 'ucr-cell-pass' :
                    row.remark === 'F' || row.remark === 'Fail' ? 'ucr-cell-fail' : ''
                  }`}>
                    {row.remark}
                  </td>
                </tr>
              ))}

              {/* ──── EMPTY PADDING ROWS ──── */}
              {Array.from({ length: emptyRowCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="ucr-empty-row">
                  <td></td>
                  <td></td>
                  <td></td>
                  {data.bsatColumns.map(col => (
                    <td key={`e-${col.id}-${i}`}></td>
                  ))}
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ═══════ SIGNATURE FOOTER ═══════ */}
        <div className="ucr-signature-section">
          <div className="ucr-signature-row">
            <div className="ucr-sig-box">
              <div className="ucr-sig-line">
                <div className="ucr-sig-title">Test by</div>
              </div>
              <div className="ucr-sig-name">{data.testedBy}</div>
            </div>
            <div className="ucr-sig-box">
              <div className="ucr-sig-line">
                <div className="ucr-sig-title">Authorised Signatory</div>
              </div>
              <div className="ucr-sig-name">{data.authorizedSignatory}</div>
            </div>
          </div>
          {/* Removed: <div className="ucr-sig-company">For Advent Engineers</div> */}
        </div>
    </ReportCanvas>
  );
}
