export interface Act {
  id: string;
  name: string;
  project_id: string;
  order?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActCreateInput {
  name: string;
  project_id: string;
  description?: string;
  order?: number;
}

export interface ActUpdateInput {
  name?: string;
  description?: string;
  order?: number;
}

