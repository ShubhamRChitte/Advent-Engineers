import React from 'react';
import { SecondaryMeteringReport } from './SecondaryMeteringReport';
// Import Transformer interface to assume compatibility (structural typing)
import { Transformer } from './SecondaryTransformersList';

interface FinalMeteringReportProps {
  transformer: any; // Using any for runtime compatibility with FinalTransformer/Transformer
  core: { coreNumber: number; coreId: string; };
  testerName: string;
  onBack: () => void;
}

export function FinalMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
}: FinalMeteringReportProps) {

  return (
    <SecondaryMeteringReport
      transformer={transformer}
      coreNumber={core.coreNumber}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="final"
    />
  );
}
