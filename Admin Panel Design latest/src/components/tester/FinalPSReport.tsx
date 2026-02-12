import React from 'react';
import { SecondaryPSReport } from './SecondaryPSReport';
// Import Transformer interface to assume compatibility
import { Transformer } from './SecondaryTransformersList';

interface FinalPSReportProps {
  transformer: any; // Using any for runtime compatibility
  core: { coreNumber: number; coreId: string; };
  testerName: string;
  onBack: () => void;
}

export function FinalPSReport({
  transformer,
  core,
  testerName,
  onBack,
}: FinalPSReportProps) {

  return (
    <SecondaryPSReport
      transformer={transformer}
      coreNumber={core.coreNumber}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="final"
    />
  );
}