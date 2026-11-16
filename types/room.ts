export type RoomStatus = 'vacant' | 'occupied' | 'maintenance' | 'out_of_service';
export type RoomType = 'single' | 'double' | 'triple' | 'four';

export interface BuildingItem {
  id: number;
  pg_id?: number;
  branch_id: number;
  pg_name?: string;
  branch_name?: string;
  branch_title?: string;
  name: string;
  total_floors?: number;
  total_rooms?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FloorItem {
  id: number;
  pg_id?: number;
  branch_id?: number;
  pg_name?: string;
  branch_name?: string;
  building_id: number;
  building_name?: string;
  floor_number: number;
  name: string;
  total_rooms?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoomFloorDetail {
  id: number;
  floor_id: number;
  floor_number: number;
  name: string;
  total_rooms: number;
}

export interface RoomBuilding {
  building_id: number;
  building_name: string;
  floors: number[];
  floor_details: RoomFloorDetail[];
  total_floors: number;
  total_rooms: number;
}

export interface Room {
  id: number;
  pg_id: number;
  room_no: string;
  room_type: string;
  capacity: number;
  size?: string | null;
  status: RoomStatus | string;
  created_at: string;
  updated_at: string;
  image?: string | null;
  image_url?: string | null;
  deleted_at?: string | null;
  building_id: number;
  floor_id: number;
  branch_id: number;
  pg_name?: string;
  owner_id?: number;
  branch_name?: string;
  building_name?: string;
  floor_name?: string;
  floor_number?: number;
  current_occupants?: number;
  current_occupant_name?: string | null;
  available_beds?: number;
  is_available?: boolean;
  sharing_label?: string;
  display_label?: string;
}

export interface RoomStats {
  total_rooms: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  out_of_service: number;
}

export interface RoomMeta {
  page: number;
  limit: number;
  total_pages: number;
  total_items: number;
}

export interface RoomFilterParams {
  page?: number;
  limit?: number;
  branch_id?: number | string;
  building_id?: number | string;
  floor_id?: number | string;
  status?: string;
  room_type?: string;
  search?: string;
}
