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
  core: CoreConfig;
  testerName: string;
  onBack: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
}

export function AfterPrimaryMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
  primaryCurrent,
  secondaryCurrent,
  order,
}: AfterPrimaryMeteringReportProps) {

  return (
    <SecondaryMeteringReport
      transformer={transformer}
      coreId={core.coreId}
      coreNumber={core.coreNumber}
      testerName={testerName}
      onBack={onBack}
      stage="primary"
      accuracyClass={core.accuracyClass}
      primaryCurrent={primaryCurrent}
      secondaryCurrent={secondaryCurrent}
      order={order}
    />
  );
}
