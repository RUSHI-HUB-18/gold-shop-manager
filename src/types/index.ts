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

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  mobileNumber: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstNumber?: string | null;
  birthDate?: string | null;
  anniversary?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  calculations?: HistoryEntry[];
}

export interface CustomerFormPayload {
  fullName: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  birthDate?: string | null;
  anniversary?: string | null;
  notes?: string;
}

export type DocumentType = 'INVOICE' | 'ESTIMATE' | 'QUOTATION';
export type BillStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type DiscountType = 'FLAT' | 'PERCENTAGE';
export type MakingChargeType = 'FLAT' | 'PERCENTAGE';

export interface BillItem {
  id: string;
  billId: string;
  itemId?: string | null;
  itemNameSnapshot: string;
  quantity: number;
  grossWeight: string | number;
  netWeight: string | number;
  stoneWeight: string | number;
  purity: string;
  goldRate: string | number;
  makingChargeType: MakingChargeType;
  makingChargeValue: string | number;
  makingChargeAmount: string | number;
  hallmarkCharge: string | number;
  wastage: string | number;
  gstPercentage: string | number;
  gstAmount: string | number;
  amount: string | number;
  remarks?: string | null;
  item?: { name: string } | null;
}

export interface Bill {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  customerId?: string | null;
  userId: string;
  createdByName: string;
  invoiceDate: string;
  status: BillStatus;
  paymentStatus: PaymentStatus;
  version: number;
  
  subtotal: string | number;
  discountType: DiscountType;
  discountValue: string | number;
  discountAmount: string | number;
  taxableAmount: string | number;
  gstAmount: string | number;
  total: string | number;
  notes?: string | null;

  storeName: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  storeGstNumber?: string | null;

  customerNameSnapshot?: string | null;
  customerMobileSnapshot?: string | null;
  customerAddressSnapshot?: string | null;
  customerGstSnapshot?: string | null;

  createdAt: string;
  updatedAt: string;
  items?: BillItem[];
  customer?: { fullName: string; customerCode: string; mobileNumber: string } | null;
  user?: { fullName: string } | null;
}

export interface BillFormItemPayload {
  itemId?: string;
  itemNameSnapshot: string;
  quantity: number;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  purity: string;
  goldRate: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  makingChargeAmount: number;
  hallmarkCharge: number;
  wastage: number;
  gstPercentage: number;
  gstAmount: number;
  amount: number;
  remarks?: string;
}

export interface BillFormPayload {
  customerId?: string;
  documentType: DocumentType;
  status: BillStatus;
  paymentStatus: PaymentStatus;
  
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  total: number;
  notes?: string;
  
  items: BillFormItemPayload[];
}
