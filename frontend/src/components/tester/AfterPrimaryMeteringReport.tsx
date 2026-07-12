import { SecondaryMeteringReport } from './SecondaryMeteringReport';
import { Transformer } from './AfterPrimaryTransformersList';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
  accuracyClass?: string | undefined;
}

interface AfterPrimaryMeteringReportProps {
  transformer: Transformer;
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
  onFail?: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
  onCompleteTimer?: () => Promise<void>;
}

export function AfterPrimaryMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
  onFail,
  primaryCurrent,
  secondaryCurrent,
  order,
  onCompleteTimer,
}: AfterPrimaryMeteringReportProps) {

  return (
    <SecondaryMeteringReport
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
    />
  );
}
