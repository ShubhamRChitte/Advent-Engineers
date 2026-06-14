import { FailedCoresManager } from '../components/testing/FailedCoresManager';
import useSWR from 'swr';
import axios from '@/utils/axiosConfig';
import { Loader2 } from 'lucide-react';
import { FailedCoreSummaryReport } from '../components/testing/FailedCoreSummaryReport';

export function FailedCoresPage() {
    const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(res => res.data);
    const { data, error, isLoading, mutate } = useSWR(
        `/failed-cores?limit=1000`,
        fetcher,
        { refreshInterval: 30000 }
    );

    const failedCores = data?.success ? data.data : [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading Failed Cores Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
                    <p className="font-bold">Error Loading Dashboard</p>
                    <p>Unable to load failed cores. Please try again later.</p>
                    <button
                        onClick={() => mutate()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/*
              PRINT REPORT — must live OUTSIDE the print:hidden wrapper.
              FailedCoreSummaryReport has self-contained @media print CSS that uses
              `body * { visibility: hidden }` + `#print-section { position: absolute }`
              to overlay the page on print. If it were inside print:hidden (display:none),
              that CSS cannot rescue it — display:none on a parent removes children from
              layout entirely regardless of child visibility rules.
            */}
            <FailedCoreSummaryReport data={failedCores} />

            {/* NORMAL UI — hidden on print so only the report above shows */}
            <div className="print:hidden">
                <FailedCoresManager
                    failedCores={failedCores}
                    onBack={() => mutate()}
                />
            </div>
        </div>
    );
}
