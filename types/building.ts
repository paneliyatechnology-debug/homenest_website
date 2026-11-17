export interface BuildingStats {
  total_buildings: number;
  total_floors: number;
  total_rooms: number;
}

export interface BuildingFloor {
  id?: number;
  building_id?: number;
  floor_number: number;
  name: string;
  total_rooms?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Building {
  id: number;
  pg_id?: number;
  branch_id: number;
  pg_name?: string;
  branch_name?: string;
  branch_title?: string;
  owner_id?: number;
  name: string;
  total_floors?: number;
  total_rooms?: number;
  created_at?: string;
  updated_at?: string;
  floors?: BuildingFloor[];
}

export interface BuildingFloorInput {
  id?: string | number;
  floor_number: number;
  name: string;
}

export interface BuildingFormData {
  branch_id: string;
  name: string;
  floors: BuildingFloorInput[];
}

export interface BuildingMeta {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface BuildingFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_id?: number | string;
}
