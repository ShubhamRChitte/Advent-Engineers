import { SecondaryPSReport } from './SecondaryPSReport';

interface FinalPSReportProps {
  transformer: any; // Using any for runtime compatibility
  core: { coreNumber: number; coreId: string; accuracyClass?: string; };
  testerName: string;
  onBack: () => void;
  onFail?: () => void;
  primaryCurrent?: string;
  secondaryCurrent?: string;
  order?: any;
}

export function FinalPSReport({
  transformer,
  core,
  testerName,
  onBack,
  onFail,
  primaryCurrent,
  secondaryCurrent,
  order,
}: FinalPSReportProps) {

  return (
    <SecondaryPSReport
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
