import React from 'react';
import logoImage from '../../assets/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ReportHeaderProps {
    title: string;
    orderId?: string;
    clientName?: string;
    reportDate?: string;
    batchId?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
    title,
    orderId = '',
    clientName = '',
    reportDate = new Date().toLocaleDateString(),
    batchId = ''
}) => {
    return (
        <div className="report-header mb-6 pb-4 border-b-2 border-gray-800">
            <div className="flex justify-between items-start">
                {/* Left: Brand */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 relative">
                        <ImageWithFallback
                            src={logoImage}
                            alt="Advent Engineers Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003a70] m-0 leading-none">
                            ADVENT ENGINEERS
                        </h1>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                            Excellence in Transformer Core Testing
                        </p>
                    </div>
                </div>

                {/* Right: Metadata */}
                <div className="text-right text-sm">
                    <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-gray-700">
                        <span className="font-semibold text-gray-900">Date:</span>
                        <span>{reportDate}</span>

                        {orderId && (
                            <>
                                <span className="font-semibold text-gray-900">Order No:</span>
                                <span>{orderId}</span>
                            </>
                        )}

                        {clientName && (
                            <>
                                <span className="font-semibold text-gray-900">Client:</span>
                                <span>{clientName}</span>
                            </>
                        )}

                        {batchId && (
                            <>
                                <span className="font-semibold text-gray-900">Batch ID:</span>
                                <span>{batchId}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-gray-900 mt-6 uppercase tracking-wide border-2 border-gray-200 py-2 bg-gray-50">
                {title}
            </h2>
        </div>
    );
};
