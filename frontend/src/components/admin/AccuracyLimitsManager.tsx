import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { accuracyLimitsApi } from '../../utils/api';
import { toast } from 'sonner';

export function AccuracyLimitsManager() {
    const [activeTab, setActiveTab] = useState<'metering' | 'protection' | 'ps'>('metering');
    const [limits, setLimits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchLimits();
    }, [activeTab]);

    const fetchLimits = async () => {
        setIsLoading(true);
        try {
            const data = await accuracyLimitsApi.getLimitsByType(activeTab);
            // PS only returns 1 doc typically, others return array
            setLimits(Array.isArray(data) ? data : [data]);
        } catch (error) {
            toast.error('Failed to load limits');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (limit: any) => {
        try {
            await accuracyLimitsApi.updateLimit(limit);
            toast.success('Limit updated successfully');
            fetchLimits(); // refresh
        } catch (error) {
            toast.error('Failed to update limit');
            console.error(error);
        }
    };

    const handleMeteringLimitChange = (index: number, loadIndex: number, field: string, value: string) => {
        const newLimits = [...limits];
        newLimits[index].limits[loadIndex][field] = value === '' ? null : Number(value);
        setLimits(newLimits);
    };

    const handleProtectionLimitChange = (index: number, field: string, value: string) => {
        const newLimits = [...limits];
        newLimits[index][field] = value === '' ? null : Number(value);
        setLimits(newLimits);
    };

    const handlePSLimitChange = (index: number, field: string, value: string) => {
        const newLimits = [...limits];
        newLimits[index][field] = value === '' ? null : Number(value);
        setLimits(newLimits);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Accuracy Limits Configuration</h2>
            </div>

            <div className="flex space-x-4 border-b pb-2">
                <Button
                    variant={activeTab === 'metering' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('metering')}
                >
                    Metering
                </Button>
                <Button
                    variant={activeTab === 'protection' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('protection')}
                >
                    Protection
                </Button>
                <Button
                    variant={activeTab === 'ps' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('ps')}
                >
                    PS Core
                </Button>
            </div>

            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {activeTab === 'metering' && limits.map((limitClass, idx) => (
                        <Card key={limitClass._id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Class: {limitClass.accuracyClass}</CardTitle>
                                <Button size="sm" onClick={() => handleSave(limitClass)}>Save</Button>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-2">Load</th>
                                            <th className="text-left py-2">Ratio Limit (±%)</th>
                                            <th className="text-left py-2">Phase Limit (±m)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {limitClass.limits.map((l: any, loadIdx: number) => (
                                            <tr key={loadIdx}>
                                                <td className="py-2 font-medium">{l.load}</td>
                                                <td className="py-2 pr-4">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={l.ratioLimit === null ? '' : l.ratioLimit}
                                                        onChange={(e) => handleMeteringLimitChange(idx, loadIdx, 'ratioLimit', e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        value={l.phaseLimit === null ? '' : l.phaseLimit}
                                                        onChange={(e) => handleMeteringLimitChange(idx, loadIdx, 'phaseLimit', e.target.value)}
                                                        placeholder="N/A"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    ))}

                    {activeTab === 'protection' && limits.map((limitClass, idx) => (
                        <Card key={limitClass._id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Class: {limitClass.protectionClass}</CardTitle>
                                <Button size="sm" onClick={() => handleSave(limitClass)}>Save</Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <label className="text-sm font-medium">Max Current Error (±%)</label>
                                    <Input
                                        type="number" step="0.1"
                                        value={limitClass.maxCurrentError || ''}
                                        onChange={(e) => handleProtectionLimitChange(idx, 'maxCurrentError', e.target.value)}
                                    />

                                    <label className="text-sm font-medium">Max Phase Error (±m)</label>
                                    <Input
                                        type="number" step="1"
                                        value={limitClass.maxPhaseError === null ? '' : limitClass.maxPhaseError}
                                        onChange={(e) => handleProtectionLimitChange(idx, 'maxPhaseError', e.target.value)}
                                        placeholder="N/A"
                                    />

                                    <label className="text-sm font-medium">Max Composite Error (≤%)</label>
                                    <Input
                                        type="number" step="0.1"
                                        value={limitClass.maxCompositeError || ''}
                                        onChange={(e) => handleProtectionLimitChange(idx, 'maxCompositeError', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {activeTab === 'ps' && limits.map((limitClass, idx) => (
                        limitClass.coreType === 'ps' && (
                            <Card key={limitClass._id || 'ps-card'}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>PS Core Rules</CardTitle>
                                    <Button size="sm" onClick={() => handleSave(limitClass)}>Save</Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium">Ratio Error Limit (± value)</label>
                                        <Input
                                            type="number" step="0.01"
                                            value={limitClass.psRatioErrorLimit || ''}
                                            onChange={(e) => handlePSLimitChange(idx, 'psRatioErrorLimit', e.target.value)}
                                        />

                                        <label className="text-sm font-medium">Excitation Check Multiplier</label>
                                        <div className="flex flex-col gap-1">
                                            <Input
                                                type="number" step="0.1"
                                                value={limitClass.psExcitationMultiplier || ''}
                                                onChange={(e) => handlePSLimitChange(idx, 'psExcitationMultiplier', e.target.value)}
                                            />
                                            <span className="text-xs text-gray-500">IexVk * Multiplier {'<='} Iex11Vk</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
