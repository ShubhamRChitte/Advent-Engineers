/**
 * Reports Module - Barrel Export
 * 
 * Centralizes all report-related component exports.
 * Benefits:
 * - Single source of truth for imports
 * - Easier refactoring (change paths in one place)
 * - TypeScript auto-completion works better
 * - Prevents missing imports (compile-time error if component doesn't exist)
 * 
 * Usage:
 * import { ReportHeader, ReportFooter } from '@/components/reports';
 */

export { ReportHeader } from './ReportHeader';

// Future report components can be added here:
// export { ReportFooter } from './ReportFooter';
// export { ReportTable } from './ReportTable';
// export { PrintableReport } from './PrintableReport';
