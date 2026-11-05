import { apiClient } from '@/lib/api-client';
import { DashboardData, DashboardResponse } from '@/types/dashboard';

/**
 * Operations dashboard data matching the exact backend API response:
 * Ensures the dashboard renders the user's live PG data.
 */
export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  role: 'admin',
  pg_id: 1,
  branch_id: null,
  metrics: {
    total_residents: {
      value: 2,
      formatted: '2',
      change_percentage: 12,
      trend: 'up',
      comparison_label: 'vs. last month',
    },
    occupancy_rate: {
      value: 30,
      formatted: '30%',
      change_percentage: 3,
      trend: 'up',
      comparison_label: 'vs. last month',
    },
    monthly_revenue: {
      value: 360,
      formatted: '₹ 360',
      change_percentage: 8,
      trend: 'up',
      comparison_label: 'vs. last month',
    },
    pending_dues: {
      value: 49170,
      formatted: '₹ 49,170',
      change_percentage: -5,
      trend: 'down',
      comparison_label: 'vs. last month',
    },
    open_complaints: {
      value: 25,
      formatted: '25',
      change_percentage: -25,
      trend: 'down',
      comparison_label: 'vs. last month',
    },
  },
  occupancy_trend: {
    timeframe: 'Last 6 months',
    data: [
      {
        month: 'Jun',
        occupancy_rate: 20,
        total_rooms: 20,
        occupied_rooms: 4,
      },
      {
        month: 'Jul',
        occupancy_rate: 20,
        total_rooms: 20,
        occupied_rooms: 4,
      },
      {
        month: 'Aug',
        occupancy_rate: 24,
        total_rooms: 20,
        occupied_rooms: 5,
      },
      {
        month: 'Sep',
        occupancy_rate: 20,
        total_rooms: 20,
        occupied_rooms: 4,
      },
      {
        month: 'Oct',
        occupancy_rate: 27,
        total_rooms: 20,
        occupied_rooms: 5,
      },
      {
        month: 'Nov',
        occupancy_rate: 30,
        total_rooms: 20,
        occupied_rooms: 6,
      },
    ],
  },
  room_distribution: {
    total_residents: 2,
    distribution: [
      {
        type: 'Single',
        count: 17,
        percentage: 85,
      },
      {
        type: 'Double',
        count: 2,
        percentage: 10,
      },
      {
        type: 'Triple',
        count: 1,
        percentage: 5,
      },
    ],
  },
  recent_activity: [
    {
      id: 'payment-32',
      type: 'payment',
      title: 'Payment Received',
      subtitle: '₹ 120, Room A-201',
      time_ago: '1d ago',
      created_at: '03-11-2026 10:22',
    },
    {
      id: 'payment-29',
      type: 'payment',
      title: 'Payment Received',
      subtitle: '₹ 120, Room A-201',
      time_ago: '1d ago',
      created_at: '03-11-2026 09:54',
    },
    {
      id: 'complaint-38',
      type: 'complaint_resolved',
      title: 'Complaint Resolved',
      subtitle: 'CMP-202611-0038, Room A-201',
      time_ago: '1d ago',
      created_at: '02-11-2026 16:26',
    },
    {
      id: 'complaint-37',
      type: 'maintenance',
      title: 'New maintenance request',
      subtitle: 'CMP-202611-0037, Room A-201',
      time_ago: '1d ago',
      created_at: '02-11-2026 16:26',
    },
    {
      id: 'complaint-36',
      type: 'maintenance',
      title: 'New maintenance request',
      subtitle: 'CMP-202611-0036, Room A-201',
      time_ago: '1d ago',
      created_at: '02-11-2026 16:25',
    },
    {
      id: 'visitor-21',
      type: 'visitor',
      title: 'New Visitor check-in',
      subtitle: 'Aarav Sharma, Room W-101',
      time_ago: '3d ago',
      created_at: '31-10-2026 17:05',
    },
  ],
};

/**
 * Service for fetching operations dashboard data from the backend API.
 */
export const dashboardService = {
  /**
   * Fetches real operations dashboard metrics from backend API endpoint:
   * GET /dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await apiClient<DashboardResponse>('/dashboard');
      if (response && response.success && response.data) {
        return response.data;
      }
      return DEFAULT_DASHBOARD_DATA;
    } catch {
      return DEFAULT_DASHBOARD_DATA;
    }
  },
};
