import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../../ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { UnifiedCTReport } from './UnifiedCTReport';

interface FinalReportViewProps {
    transformer: any;
    onBack: () => void;
}

export function FinalReportView({ transformer, onBack }: FinalReportViewProps) {
    const order = transformer.fullOrder || transformer.orderId;
    
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between no-print mb-4 w-full">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to List
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Print Report
                </Button>
            </div>

            <div ref={printRef} className="bg-white rounded-lg p-0 print:p-0">
                <UnifiedCTReport transformer={transformer} order={order} />
            </div>
        </div>
    );
}
