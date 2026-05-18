import React from 'react';
import './UnifiedCoreReport.css';

interface ReportCanvasProps {
  children: React.ReactNode;
  id?: string;
}

/**
 * ReportCanvas
 * 
 * Enforces a fixed A4 canvas for report rendering.
 * Provides a centered, scrollable preview environment on screen.
 * Ensures the report renders identically regardless of parent container width.
 */
export const ReportCanvas: React.FC<ReportCanvasProps> = ({ children, id }) => {
  return (
    <div className="ucr-report-preview-wrapper" id={id}>
      <div className="ucr-report-canvas-page">
        {children}
      </div>
    </div>
  );
};
