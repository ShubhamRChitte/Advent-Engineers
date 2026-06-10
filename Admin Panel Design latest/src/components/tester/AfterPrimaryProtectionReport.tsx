import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { Transformer } from './AfterPrimaryTransformersList';

interface PrimaryProtectionReportProps {
  transformer: Transformer;
  core: { coreNumber: number; coreId: string; accuracyClass?: string | undefined };
  testerName: string;
  onBack: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onCompleteTimer?: () => Promise<void>;
}

export function AfterPrimaryProtectionReport({
  transformer,
  core,
  testerName,
  onBack,
  primaryCurrent,
  secondaryCurrent,
  order,
  onCompleteTimer,
}: PrimaryProtectionReportProps) {

  return (
    <SecondaryProtectionReport
      transformer={transformer}
      coreId={core.coreId}
      coreNumber={core.coreNumber}
      testerName={testerName}
      onBack={onBack}
      stage="primary"
      accuracyClass={core.accuracyClass}
      primaryCurrent={primaryCurrent || ''}
      secondaryCurrent={secondaryCurrent || ''}
      order={order}
      onCompleteTimer={onCompleteTimer || (async () => {})}
    />
  );
}
