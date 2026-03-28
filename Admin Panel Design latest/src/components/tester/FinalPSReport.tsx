import { SecondaryPSReport } from './SecondaryPSReport';

interface FinalPSReportProps {
  transformer: any; // Using any for runtime compatibility
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
}

export function FinalPSReport({
  transformer,
  core,
  testerName,
  onBack,
}: FinalPSReportProps) {

  return (
    <SecondaryPSReport
      transformer={transformer}
      coreId={core.coreId}
      testerName={testerName}
      onBack={onBack}
      stage="final"
      accuracyClass={core.accuracyClass}
    />
  );
}
