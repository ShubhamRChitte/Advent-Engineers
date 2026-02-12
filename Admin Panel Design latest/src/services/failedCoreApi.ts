import api from '../api/axios';

export interface FailedCore {
    _id: string;
    orderId: string;
    orderNumber?: string;
    jobId: string;
    clientName: string;
    internalCoreNo: string;
    vendorCoreNo?: string;
    coreType: string;
    vendorId?: string;
    vendorName?: string;
    failureReason: string;
    failureStage: string;
    status: 'FAILED' | 'REPLACED';
    failedAt: string;
    dynamicValues?: Record<string, any>;
    replacedByCoreId?: string;
}

export interface FailedCoreFilters {
    page?: number;
    limit?: number;
    search?: string;
    orderId?: string;
    vendorId?: string;
    coreType?: string;
    failureStage?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export interface FailedCoresResponse {
    success: boolean;
    data: FailedCore[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const failedCoreApi = {
    // Fetch with filters and pagination
    getAll: async (params: FailedCoreFilters = {}): Promise<FailedCoresResponse> => {
        const response = await api.get('/failed-cores', { params });
        return response.data;
    },

    // Get count for badges
    getCount: async (): Promise<{ count: number }> => {
        const response = await api.get('/failed-cores/count');
        return response.data;
    },

    // Get single detail (if needed)
    getById: async (id: string): Promise<FailedCore> => {
        const response = await api.get(`/failed-cores/${id}`);
        return response.data;
    }
};
