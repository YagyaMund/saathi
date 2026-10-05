export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  summary: string;
  description: string;
  materials: string;
  weightGrams: number;
  origin: string;
  sku: string;
  tags: string[];
  image: string;
  localInsight: string;
};

export type Customer = {
  id: string;
  email: string;
  fullName: string;
  city: string;
  region: string;
  segment: string;
  createdAt: string;
};

export type WarehouseOrder = {
  id: string;
  customerId: string;
  orderedAt: string;
  channel: "web" | "store";
  status: "fulfilled";
  items: { productId: string; quantity: number }[];
};

export type Warehouse = {
  customers: Customer[];
  orders: WarehouseOrder[];
};

export type PricedItem = {
  id: string;
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PricedOrder = WarehouseOrder & {
  items: PricedItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

export type InsightSummary = {
  revenue: number;
  orderCount: number;
  months: { month: string; label: string; revenue: number }[];
  repeatCustomers: number;
  activeCustomers: number;
  repeatRate: number;
  topProducts: {
    productId: string;
    name: string;
    category: string;
    units: number;
    revenue: number;
  }[];
  channels: {
    channel: string;
    orders: number;
    revenue: number;
    averageOrderValue: number;
  }[];
};

export type SearchHit = {
  product: Product;
  snippet: string;
  score: number;
};

export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
};
