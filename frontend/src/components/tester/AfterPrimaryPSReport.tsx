import { SecondaryPSReport } from './SecondaryPSReport';
import { Transformer } from './AfterPrimaryTransformersList';

interface CoreConfig {
  coreNumber: number;
  coreType: 'metering' | 'ps' | 'protection';
  coreId: string;
  accuracyClass?: string | undefined;
}

interface AfterPrimaryPSReportProps {
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

export function AfterPrimaryPSReport({
  transformer,
  core,
  testerName,
  onBack,
  onFail,
  primaryCurrent,
  secondaryCurrent,
  order,
  onCompleteTimer,
}: AfterPrimaryPSReportProps) {

  return (
    <SecondaryPSReport
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
