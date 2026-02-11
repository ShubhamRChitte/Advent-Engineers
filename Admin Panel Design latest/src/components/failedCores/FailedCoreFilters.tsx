import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, X, Filter } from 'lucide-react';
import { FailedCoreFilters as FilterType } from '../../services/failedCoreApi';

interface FailedCoreFiltersProps {
    onFilterChange: (filters: FilterType) => void;
    filters: FilterType;
}

export function FailedCoreFilters({ onFilterChange, filters }: FailedCoreFiltersProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                onFilterChange({ ...filters, search: searchTerm, page: 1 });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters, onFilterChange]);

    const handleStatusChange = (val: string) => {
        onFilterChange({ ...filters, status: val === 'ALL' ? undefined : val, page: 1 });
    };

    const handleCoreTypeChange = (val: string) => {
        onFilterChange({ ...filters, coreType: val === 'ALL' ? undefined : val, page: 1 });
    };

    const clearFilters = () => {
        setSearchTerm('');
        onFilterChange({ page: 1, limit: filters.limit });
    };

    return (
        <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search Order, Vendor, or Core No..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={filters.status || 'ALL'} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="REPLACED">Replaced</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.coreType || 'ALL'} onValueChange={handleCoreTypeChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Core Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="Metering">Metering</SelectItem>
                            <SelectItem value="Protection">Protection</SelectItem>
                            <SelectItem value="PS">PS Class</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Reset */}
                    {(filters.status || filters.coreType || filters.search) && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="text-gray-500 hover:text-red-600">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
