import { useState, useEffect, useCallback } from 'react';
import { FailedCore, FailedCoreFilters as FilterType, failedCoreApi } from '../services/failedCoreApi';
import { FailedCoreFilters } from '../components/failedCores/FailedCoreFilters';
import { FailedCoresTable } from '../components/failedCores/FailedCoresTable';
import { FailureDetailSheet } from '../components/failedCores/FailureDetailSheet';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis
} from '../components/ui/pagination';
import { AlertTriangle } from 'lucide-react';

export default function FailedCoresPage() {
    const [data, setData] = useState<FailedCore[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCore, setSelectedCore] = useState<FailedCore | null>(null);

    // Filter & Pagination State
    const [filters, setFilters] = useState<FilterType>({
        page: 1,
        limit: 10,
        search: '',
        status: 'FAILED', // Default to showing active failures
    });

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await failedCoreApi.getAll(filters);
            setData(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error("Failed to fetch failed cores:", error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        Failed Cores Manager
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Monitor, audit, and track all failed cores across orders.
                    </p>
                </div>

                <FailedCoreFilters
                    filters={filters}
                    onFilterChange={(newFilters) => setFilters(newFilters)}
                />

                <FailedCoresTable
                    data={data}
                    loading={loading}
                    onRowClick={setSelectedCore}
                />

                {/* Pagination Control */}
                {!loading && pagination.pages > 1 && (
                    <Pagination className="mt-4">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    size="default"
                                    onClick={(e) => { e.preventDefault(); handlePageChange(pagination.page - 1); }}
                                    aria-disabled={pagination.page <= 1}
                                    className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {/* Simple Page Numbers for now (can be enhanced with ellipsis logic) */}
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                // Logic to show pages around current page could replace this simple logic
                                let p = i + 1;
                                if (pagination.pages > 5 && pagination.page > 3) {
                                    p = pagination.page - 2 + i;
                                }
                                if (p > pagination.pages) return null;

                                return (
                                    <PaginationItem key={p}>
                                        <PaginationLink
                                            href="#"
                                            size="icon"
                                            isActive={pagination.page === p}
                                            onClick={(e) => { e.preventDefault(); handlePageChange(p); }}
                                        >
                                            {p}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            {pagination.pages > 5 && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    size="default"
                                    onClick={(e) => { e.preventDefault(); handlePageChange(pagination.page + 1); }}
                                    aria-disabled={pagination.page >= pagination.pages}
                                    className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}

                <FailureDetailSheet
                    core={selectedCore}
                    onClose={() => setSelectedCore(null)}
                />
            </div>
        </ErrorBoundary>
    );
}
