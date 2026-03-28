import { SecondaryMeteringReport } from './SecondaryMeteringReport';
// Import Transformer interface to assume compatibility (structural typing)
import { Transformer } from './SecondaryTransformersList';

interface FinalMeteringReportProps {
  transformer: Transformer; // Using Transformer for type safety
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
}

export function FinalMeteringReport({
  transformer,
  core,
  testerName,
  onBack,
}: FinalMeteringReportProps) {

  return (
    <SecondaryMeteringReport
      transformer={transformer}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="final"
      accuracyClass={core.accuracyClass}
    />
  );
}
