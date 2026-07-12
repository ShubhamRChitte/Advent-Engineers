/**
 * Report Theme — Central Constants
 * 
 * Single source of truth for all report styling constants.
 * Used by UnifiedCoreReport and its CSS. Any color, spacing, or
 * typography change should be made HERE, not scattered across components.
 */

export const REPORT_THEME = {
  // Borders
  border: '#000',
  borderLight: '#d1d5db',

  // Background colors (with print-color-adjust support)
  bannerYellow: '#ffda6a',
  bannerBlue: '#92d0ff',
  emerald: '#d1fae5',
  amber: '#fffbeb',
  amberAccent: '#fef3c7',
  blueTint: '#eff6ff',
  blueAccent: '#dbeafe',
  grayLight: '#f9fafb',
  grayHeader: '#f3f4f6',
  white: '#ffffff',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textPass: '#059669',
  textFail: '#dc2626',
  brandBlue: '#003a70',

  // Typography
  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontSizeTitle: '16px',
  fontSizeSubtitle: '14px',
  fontSizeBody: '11px',
  fontSizeSmall: '10px',

  // Page dimensions (A4)
  pageWidth: '210mm',
  pageMinHeight: '297mm',
  printableWidth: '190mm',
  pageMargin: '10mm',

  // Table
  cellPadding: '6px',
  emptyRowHeight: '24px',
  minDataRows: 14,
} as const;

export type ReportTheme = typeof REPORT_THEME;
