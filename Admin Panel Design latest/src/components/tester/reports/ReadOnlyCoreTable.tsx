
import React from 'react';
import { Card } from '../../ui/card';

interface ReadOnlyCoreTableProps {
    coreType: 'metering' | 'protection' | 'ps';
    data: any[]; // The results array
}

export const ReadOnlyCoreTable: React.FC<ReadOnlyCoreTableProps> = ({ coreType, data }) => {
    if (!data || data.length === 0) {
        return <div className="p-4 text-gray-500 italic">No results recorded for this core type.</div>;
    }

    // --- METERING TABLE ---
    if (coreType === 'metering') {
        return (
            <div className="space-y-6">
                {data.map((result, idx) => (
                    <Card key={idx} className="p-4 overflow-hidden">
                        <div className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded">
                            <h4 className="font-semibold text-sm">Ratio: {result.ratioValue || `Config ${idx + 1}`}</h4>
                            <span className="text-xs text-gray-500">Core ID: {result.internalCoreNo || result.coreId || '-'}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 bg-gray-100 uppercase ">
                                    <tr>
                                        <th className="px-2 py-1">Current</th>
                                        <th className="px-2 py-1">R-100%</th>
                                        <th className="px-2 py-1">P-100%</th>
                                        <th className="px-2 py-1">R-25%</th>
                                        <th className="px-2 py-1">P-25%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {result.rows && result.rows.map((row: any, rIdx: number) => (
                                        <tr key={rIdx}>
                                            <td className="px-2 py-1 font-medium">{row.current}</td>
                                            <td className="px-2 py-1">{row.r100}</td>
                                            <td className="px-2 py-1">{row.p100}</td>
                                            <td className="px-2 py-1">{row.r25}</td>
                                            <td className="px-2 py-1">{row.p25}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    // --- PROTECTION TABLE ---
    if (coreType === 'protection') {
        return (
            <div className="space-y-6">
                {data.map((result, idx) => (
                    <Card key={idx} className="p-4 overflow-hidden">
                        <div className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded">
                            <h4 className="font-semibold text-sm">Ratio: {result.ratioValue || `Config ${idx + 1}`}</h4>
                            <span className="text-xs text-gray-500">Core ID: {result.internalCoreNo || result.coreId || '-'}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 bg-gray-100 uppercase">
                                    <tr>
                                        <th className="px-2 py-1">Burden 1</th>
                                        <th className="px-2 py-1">Burden 2</th>
                                        <th className="px-2 py-1">Res (Ω)</th>
                                        <th className="px-2 py-1">Sec Lim Vtg</th>
                                        <th className="px-2 py-1">Exc Cur</th>
                                        <th className="px-2 py-1">Comp Err</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <tr>
                                        <td className="px-2 py-1">{result.burden100_1 || '-'}</td>
                                        <td className="px-2 py-1">{result.burden100_2 || '-'}</td>
                                        <td className="px-2 py-1">{result.resistance || '-'}</td>
                                        <td className="px-2 py-1">{result.secondaryLimitingVtg || '-'}</td>
                                        <td className="px-2 py-1">{result.excitationCurrent || '-'}</td>
                                        <td className="px-2 py-1">{result.compositeError || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    // --- PS CLASS TABLE ---
    if (coreType === 'ps') {
        return (
            <div className="space-y-6">
                {data.map((result, idx) => (
                    <Card key={idx} className="p-4 overflow-hidden">
                        <div className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded">
                            <h4 className="font-semibold text-sm">Ratio: {result.ratioValue || `Config ${idx + 1}`}</h4>
                            <span className="text-xs text-gray-500">Core ID: {result.internalCoreNo || result.coreId || '-'}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 bg-gray-100 uppercase">
                                    <tr>
                                        <th className="px-2 py-1">Ratio Err</th>
                                        <th className="px-2 py-1">Res (Ω)</th>
                                        <th className="px-2 py-1">Vk</th>
                                        <th className="px-2 py-1">Vk Val</th>
                                        <th className="px-2 py-1">Iex at Vk</th>
                                        <th className="px-2 py-1">Iex at 1.1Vk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <tr>
                                        <td className="px-2 py-1">{result.turnRatioError || '-'}</td>
                                        <td className="px-2 py-1">{result.resistance || '-'}</td>
                                        <td className="px-2 py-1">{result.vk || '-'}</td>
                                        <td className="px-2 py-1">{result.vkVal || '-'}</td>
                                        <td className="px-2 py-1">{result.iexVk || '-'}</td>
                                        <td className="px-2 py-1">{result.iex11Vk || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return null;
};
