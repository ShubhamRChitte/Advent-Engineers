import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { Transformer } from './SecondaryTransformersList';

interface FinalProtectionReportProps {
  transformer: Transformer;
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
  onFail?: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
}

export function FinalProtectionReport({
  transformer,
  core,
  testerName,
  onBack,
  onFail,
  primaryCurrent,
  secondaryCurrent,
  order,
}: FinalProtectionReportProps) {

  return (
    <SecondaryProtectionReport
      transformer={transformer}
      coreId={core.coreId}
      coreNumber={core.coreNumber}
      testerName={testerName}
      onBack={onBack}
      onFail={onFail}
      stage="final"
      accuracyClass={core.accuracyClass}
      primaryCurrent={primaryCurrent || ''}
      secondaryCurrent={secondaryCurrent || ''}
      order={order}
    />
  );
}
