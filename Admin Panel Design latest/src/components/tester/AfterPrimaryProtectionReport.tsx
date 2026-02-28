import React from 'react';
import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { Transformer } from './SecondaryTransformersList';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
}

interface PrimaryProtectionReportProps {
  transformer: Transformer;
  core: CoreConfig;
  testerName: string;
  onBack: () => void;
}

export function AfterPrimaryProtectionReport({
  transformer,
  core,
  testerName,
  onBack,
}: PrimaryProtectionReportProps) {

  return (
    <SecondaryProtectionReport
      transformer={transformer}
      coreNumber={core.coreNumber}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="primary"
    />
  );
}
