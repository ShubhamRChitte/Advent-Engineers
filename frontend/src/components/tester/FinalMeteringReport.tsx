import { SecondaryMeteringReport } from './SecondaryMeteringReport';
// Import Transformer interface to assume compatibility (structural typing)
import { Transformer } from './SecondaryTransformersList';

interface FinalMeteringReportProps {
  transformer: Transformer; // Using Transformer for type safety
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
  onFail?: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
}

export function FinalMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
  onFail,
  primaryCurrent,
  secondaryCurrent,
  order,
}: FinalMeteringReportProps) {

  return (
    <SecondaryMeteringReport
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
