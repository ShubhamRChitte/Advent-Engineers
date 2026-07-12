import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, X } from 'lucide-react';
import { toast } from 'sonner';

interface PrintableCoreLabelsProps {
  coreIds: string[];
  coreType: string;
  orderId: string;
  clientName: string;
  onClose: () => void;
}

export function PrintableCoreLabels({
  coreIds,
  coreType,
  orderId,
  clientName,
  onClose,
}: PrintableCoreLabelsProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Core Labels - ${orderId}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            
            .label-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10mm;
              padding: 5mm;
            }
            
            .label {
              border: 2px solid #003a70;
              border-radius: 8px;
              padding: 10px;
              page-break-inside: avoid;
              background: white;
              height: 80mm;
              display: flex;
              flex-direction: column;
            }
            
            .label-header {
              text-align: center;
              border-bottom: 2px solid #dc2626;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            
            .company-name {
              font-size: 18px;
              font-weight: bold;
              color: #003a70;
              margin-bottom: 4px;
            }
            
            .label-title {
              font-size: 12px;
              color: #dc2626;
              font-weight: bold;
            }
            
            .core-id {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              font-family: 'Courier New', monospace;
              background: #f3f4f6;
              padding: 12px;
              border: 2px dashed #003a70;
              margin: 10px 0;
              border-radius: 4px;
            }
            
            .label-info {
              font-size: 11px;
              line-height: 1.6;
              flex: 1;
            }
            
            .label-info-row {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
              padding: 4px;
              background: #f9fafb;
              border-radius: 4px;
            }
            
            .label-info-label {
              color: #6b7280;
              font-weight: 600;
            }
            
            .label-info-value {
              color: #111827;
              font-weight: bold;
            }
            
            .label-footer {
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 6px;
              margin-top: auto;
            }
            
            .qr-placeholder {
              width: 60px;
              height: 60px;
              border: 2px dashed #9ca3af;
              margin: 8px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              color: #9ca3af;
              border-radius: 4px;
            }
            
            @media print {
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      toast.success(`Printing ${coreIds.length} ${coreType} core labels`);
    }, 250);
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-GB');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Print Core Labels - {coreType} ({coreIds.length} labels)
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                className="gap-2 bg-[#003a70] hover:bg-[#002850]"
              >
                <Printer className="w-4 h-4" />
                Print All Labels
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div ref={printRef}>
          <div className="label-grid">
            {coreIds.map((coreId, index) => (
              <div key={coreId} className="label">
                <div className="label-header">
                  <div className="company-name">ADVENT ENGINEERS</div>
                  <div className="label-title">{coreType} Core Testing</div>
                </div>

                <div className="core-id">{coreId}</div>

                <div className="label-info">
                  <div className="label-info-row">
                    <span className="label-info-label">Order ID:</span>
                    <span className="label-info-value">{orderId}</span>
                  </div>
                  <div className="label-info-row">
                    <span className="label-info-label">Client:</span>
                    <span className="label-info-value">{clientName}</span>
                  </div>
                  <div className="label-info-row">
                    <span className="label-info-label">Core Type:</span>
                    <span className="label-info-value">{coreType}</span>
                  </div>
                  <div className="label-info-row">
                    <span className="label-info-label">Serial:</span>
                    <span className="label-info-value">{index + 1} of {coreIds.length}</span>
                  </div>
                  <div className="label-info-row">
                    <span className="label-info-label">Date:</span>
                    <span className="label-info-value">{getCurrentDate()}</span>
                  </div>
                </div>

                <div className="qr-placeholder">QR Code</div>

                <div className="label-footer">
                  Handle with care • Quality Tested • ISO Certified
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-4 border-t no-print">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
          <Button
            onClick={handlePrint}
            className="gap-2 bg-[#003a70] hover:bg-[#002850]"
          >
            <Printer className="w-4 h-4" />
            Print {coreIds.length} Labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
