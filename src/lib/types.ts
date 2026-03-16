export interface PosInstance {
  id: number;
  name: string;
  location: string | null;
  active: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  image_url: string | null;
  category_id: number | null;
  category_name?: string;
  active: number;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

export interface Sale {
  id: number;
  pos_id: number;
  pos_name?: string;
  client_id: number | null;
  client_name?: string | null;
  total_amount: number;
  payment_method: string;
  invoice_ref: string;
  note: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
