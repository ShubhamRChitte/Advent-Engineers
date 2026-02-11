import axios from 'axios';

// types for the response data
export interface DashboardStats {
  currentOrders: number;
  activeWorkers: number;
  pendingTests: number;
  dispatchedToday: number;
}

export interface ProductionData {
  month: string;
  production: number;
  orders: number;
  revenue: number;
  efficiency: number;
}

export interface TransformerDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TestingProgress {
  stage: string;
  completed: number;
  pending: number;
}

export interface RecentActivity {
  action: string;
  detail: string;
  time: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
}

export interface WorkerPerformance {
    name: string;
    completed: number;
    efficiency: number;
    quality: number;
}

export interface KPI {
    label: string;
    value: string;
    change: string;
    trending: 'up' | 'down';
    icon: string;
}

export interface AdvancedAnalyticsData {
    kpis: KPI[];
    workerPerformance: WorkerPerformance[];
}


const API_URL = 'http://localhost:3002/api/analytics';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};


export const analyticsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axios.get(`${API_URL}/dashboard-stats`, getHeaders());
    return response.data.stats;
  },

  getProductionOverview: async (): Promise<ProductionData[]> => {
    const response = await axios.get(`${API_URL}/production-overview`, getHeaders());
    return response.data.data;
  },

  getTransformerDistribution: async (): Promise<TransformerDistribution[]> => {
    const response = await axios.get(`${API_URL}/transformer-distribution`, getHeaders());
    return response.data.data;
  },

  getTestingProgress: async (): Promise<TestingProgress[]> => {
    const response = await axios.get(`${API_URL}/testing-progress`, getHeaders());
    return response.data.data;
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const response = await axios.get(`${API_URL}/recent-activity`, getHeaders());
    return response.data.data;
  },

  getAdvancedAnalytics: async (): Promise<AdvancedAnalyticsData> => {
      const response = await axios.get(`${API_URL}/advanced-analytics`, getHeaders());
      return response.data;
  }
};
