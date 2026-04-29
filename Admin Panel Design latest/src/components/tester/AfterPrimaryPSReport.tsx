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
  core: CoreConfig;
  testerName: string;
  onBack: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
}

export function AfterPrimaryPSReport({
  transformer,
  core,
  testerName,
  onBack,
  primaryCurrent,
  secondaryCurrent,
  order,
}: AfterPrimaryPSReportProps) {

  return (
    <SecondaryPSReport
      transformer={transformer}
      coreId={core.coreId}
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
