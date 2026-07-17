import { SecondaryProtectionReport } from './SecondaryProtectionReport';
import { Transformer } from './AfterPrimaryTransformersList';

interface PrimaryProtectionReportProps {
  transformer: Transformer;
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
  onFail?: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onCompleteTimer?: () => Promise<void>;
  onNext?: () => void;
  onPrev?: () => void;
}

export function AfterPrimaryProtectionReport({
  transformer,
  core,
  testerName,
  onBack,
  onFail,
  primaryCurrent,
  secondaryCurrent,
  order,
  onCompleteTimer,
  onNext,
  onPrev,
}: PrimaryProtectionReportProps) {

  return (
    <SecondaryProtectionReport
      transformer={transformer}
      coreId={core.coreId}
      coreNumber={core.coreNumber}
      testerName={testerName}
      onBack={onBack}
      onFail={onFail}
      stage="primary"
      accuracyClass={core.accuracyClass}
      primaryCurrent={primaryCurrent || ''}
      secondaryCurrent={secondaryCurrent || ''}
      order={order}
      onCompleteTimer={onCompleteTimer || (async () => {})}
      onNext={onNext}
      onPrev={onPrev}
    />
  );
}
