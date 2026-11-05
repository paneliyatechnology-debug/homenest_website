export interface MetricValue {
  value: number;
  formatted?: string;
  change_percentage: number;
  trend: 'up' | 'down';
  comparison_label: string;
}

export interface DashboardMetrics {
  total_residents: MetricValue;
  occupancy_rate: MetricValue;
  monthly_revenue: MetricValue;
  pending_dues: MetricValue;
  open_complaints: MetricValue;
}

export interface OccupancyMonthData {
  month: string;
  occupancy_rate: number;
  total_rooms: number;
  occupied_rooms: number;
}

export interface OccupancyTrend {
  timeframe: string;
  data: OccupancyMonthData[];
}

export interface RoomDistributionItem {
  type: string;
  count: number;
  percentage: number;
}

export interface RoomDistribution {
  total_residents: number;
  distribution: RoomDistributionItem[];
}

export interface RecentActivityItem {
  id: string;
  type: 'payment' | 'complaint_resolved' | 'maintenance' | 'visitor' | string;
  title: string;
  subtitle: string;
  time_ago: string;
  created_at: string;
}

export interface DashboardData {
  role: string;
  pg_id: number;
  branch_id: number | null;
  metrics: DashboardMetrics;
  occupancy_trend: OccupancyTrend;
  room_distribution: RoomDistribution;
  recent_activity: RecentActivityItem[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

