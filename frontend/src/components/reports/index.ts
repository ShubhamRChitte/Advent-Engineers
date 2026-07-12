/**
 * Reports Module — Barrel Export
 * 
 * Centralizes all report-related component exports.
 * Benefits:
 * - Single source of truth for imports
 * - Easier refactoring (change paths in one place)
 * - TypeScript auto-completion works better
 * - Prevents missing imports (compile-time error if component doesn't exist)
 * 
 * Usage:
 * import { ReportHeader, UnifiedCoreReport } from '@/components/reports';
 */

export { ReportHeader } from './ReportHeader';
export { UnifiedCoreReport } from './UnifiedCoreReport';
export { PrintableCoreReport } from './PrintableCoreReport';

// Re-export types
export type { UnifiedCoreReportProps } from './UnifiedCoreReport';
export type { PrintableCoreReportProps } from './PrintableCoreReport';
