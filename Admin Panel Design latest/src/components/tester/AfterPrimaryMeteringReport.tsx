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
}

export function AfterPrimaryMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
}: AfterPrimaryMeteringReportProps) {

  return (
    <SecondaryMeteringReport
      transformer={transformer}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="primary"
      accuracyClass={core.accuracyClass}
    />
  );
}
