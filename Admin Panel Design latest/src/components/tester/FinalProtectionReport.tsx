import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { Transformer } from './SecondaryTransformersList';

interface FinalProtectionReportProps {
  transformer: Transformer;
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
}

export function FinalProtectionReport({
  transformer,
  core,
  testerName,
  onBack,
}: FinalProtectionReportProps) {

  return (
    <SecondaryProtectionReport
      transformer={transformer}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="final"
      accuracyClass={core.accuracyClass}
    />
  );
}
