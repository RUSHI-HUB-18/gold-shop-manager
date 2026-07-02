export interface UserSession {
  id: string;
  role: string;
  username: string;
}

export interface Item {
  id: string;
  name: string;
  defaultMakingCharge: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoldRate {
  id?: string;
  rate22K: number;
  rate24K: number | null;
  date: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface SystemSettings {
  id?: string;
  gstPercentage: number;
  updatedAt?: string;
}

export interface HistoryEntry {
  id: string;
  weight: number;
  purity: string;
  goldRate: number;
  makingCharge: number;
  gstPercentage: number;
  finalAmount: number;
  createdAt: string;
  user: { username: string };
  item: { name: string };
}

export interface DashboardStats {
  rate22K: number;
  lastUpdated: string | null;
  updatedBy: string | null;
  calculationsCount: number;
  activeItemsCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}
