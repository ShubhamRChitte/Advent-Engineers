import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { Transformer } from './AfterPrimaryTransformersList';

interface PrimaryProtectionReportProps {
  transformer: Transformer;
  core: { coreNumber: number; coreId: string; accuracyClass?: string | undefined };
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
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="primary"
      accuracyClass={core.accuracyClass}
    />
  );
}
