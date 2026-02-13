import { useState, useEffect } from 'react';
import { FailedCoresManager } from '../components/testing/FailedCoresManager';
import { FailedCore } from '../components/testing/CoreTestingForm';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export function FailedCoresPage() {
    const [failedCores, setFailedCores] = useState<FailedCore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFailedCores = async () => {
        try {
            setError(null);
            // Fetch data from the backend
            const response = await axios.get('http://localhost:3002/api/failed-cores', {
                withCredentials: true
            });

            if (response.data && response.data.success) {
                setFailedCores(response.data.data);
            } else {
                // Fallback or empty state
                setFailedCores([]);
            }
        } catch (err: any) {
            console.error("Failed to fetch failed cores:", err);
            setError("Unable to load failed cores. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFailedCores();

        // Optional: Auto-refresh every 30 seconds for a "Live Dashboard" feel
        const interval = setInterval(fetchFailedCores, 30000);
        return () => clearInterval(interval);
    }, []);

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
                    <p>{error}</p>
                    <button
                        onClick={() => { setIsLoading(true); fetchFailedCores(); }}
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
            <FailedCoresManager
                failedCores={failedCores}
                onBack={() => {
                    // In a dedicated page, "Back" might mean go to Dashboard or just do nothing/refresh
                    // For now, we can just log or refresh
                    fetchFailedCores();
                }}
            />
        </div>
    );
}
