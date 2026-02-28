import React from 'react';
import logoImage from '../../assets/d4d1bc6f9b0c444f1821bbe84a4da57caf7080d2.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ReportHeaderProps {
    title: string;
    orderId?: string;
    clientName?: string;
    reportDate?: string;
    batchId?: string;
    tataRef?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
    title,
    orderId = '',
    clientName = '',
    reportDate = new Date().toLocaleDateString(),
    batchId = '',
    tataRef = ''
}) => {
    return (
        <div className="report-header">
            <style>{`
                @media print {
                    .report-header {
                        width: 100%;
                        margin-bottom: 10px;
                        border-bottom: 2px solid black;
                        padding-bottom: 6px;
                    }

                    /* TOP PART */
                    .header-top {
                        display: table;
                        width: 100%;
                    }

                    .header-logo {
                        display: table-cell;
                        width: 20%;
                        vertical-align: middle;
                    }

                    .header-logo img {
                        width: 85px;
                        height: 85px;
                        object-fit: contain;
                        vertical-align: middle;
                    }

                    .header-title-section {
                        display: table-cell;
                        width: 80%;
                        text-align: center;
                        vertical-align: middle;
                        padding-right: 20%; /* Offset logo space to truly center */
                    }

                    .header-title-section h1 {
                        margin: 0 !important;
                        font-size: 18px !important;
                        font-weight: bold !important;
                        color: #003a70 !important;
                    }

                    .header-title-section p {
                        margin: 2px 0 !important;
                        font-size: 11px !important;
                        color: #4b5563 !important;
                    }

                    /* BOTTOM PART */
                    .header-bottom {
                        display: table;
                        width: 100%;
                        margin-top: 5px;
                    }

                    .left-info {
                        display: table-cell;
                        width: 60%;
                        font-size: 11px;
                        vertical-align: top;
                    }

                    .right-info {
                        display: table-cell;
                        width: 40%;
                        text-align: right;
                        font-size: 11px;
                        vertical-align: top;
                    }

                    .left-info p,
                    .right-info p {
                        margin: 2px 0;
                    }
                    
                    /* Screen support for centering the Title Banner below header */
                    .header-banner-title {
                         text-align: center;
                    }
                }
                
                /* Screen styles for development consistency */
                .report-header {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #000;
                }
                .header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .header-title-section {
                    text-align: center;
                    flex-grow: 1;
                }
                .header-title-section h1 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 0;
                    color: #003a70;
                }
                .header-bottom {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 1rem;
                    font-size: 0.875rem;
                }
            `}</style>

            <div className="header-top">
                <div className="header-logo">
                    <div className="w-32 h-32 relative">
                        <ImageWithFallback
                            src={logoImage}
                            alt="Advent Engineers Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                <div className="header-title-section">
                    <h1>ADVENT ENGINEERS</h1>
                    <p>Excellence in Transformer Core Testing</p>
                </div>
            </div>

            <div className="header-bottom">
                <div className="left-info">
                    <p><strong>Date:</strong> {reportDate}</p>
                    {orderId && <p><strong>Order No:</strong> {orderId}</p>}
                    {clientName && <p><strong>Client:</strong> {clientName}</p>}
                </div>

                <div className="right-info">
                    {batchId && <p><strong>Batch ID:</strong> {batchId}</p>}
                    {tataRef && <p><strong>Tata Ref:</strong> {tataRef}</p>}
                </div>
            </div>

            {/* Centered Main Report Title */}
            <h2 className="text-xl font-bold text-center text-gray-900 mt-6 uppercase tracking-wide border-2 border-gray-200 py-2 bg-gray-50 header-banner-title">
                {title}
            </h2>
        </div>
    );
};
