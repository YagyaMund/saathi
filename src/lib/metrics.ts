import type {
  Customer,
  InsightSummary,
  PricedItem,
  PricedOrder,
  Product,
  WarehouseOrder,
} from "@/lib/types";

export const WEB_SHIPPING = 8;
export const COST_RATIO = 0.42;

function cents(dollars: number): number {
  return Math.round(dollars * 100);
}

function dollars(amount: number): number {
  return amount / 100;
}

export function productCost(price: number): number {
  return dollars(Math.round(cents(price) * COST_RATIO));
}

export function priceOrders(
  products: Product[],
  orders: WarehouseOrder[],
): PricedOrder[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return orders.map((order) => {
    const items: PricedItem[] = order.items.map((item, index) => {
      const product = byId.get(item.productId);
      if (!product) {
        throw new Error(`Unknown product ${item.productId} on ${order.id}`);
      }
      const lineCents = cents(product.price) * item.quantity;
      return {
        id: `${order.id}-${index + 1}`,
        productId: product.id,
        name: product.name,
        category: product.category,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal: dollars(lineCents),
      };
    });
    const subtotalCents = items.reduce(
      (sum, item) => sum + cents(item.lineTotal),
      0,
    );
    const shippingCents = cents(order.channel === "web" ? WEB_SHIPPING : 0);
    return {
      ...order,
      items,
      subtotal: dollars(subtotalCents),
      shipping: dollars(shippingCents),
      total: dollars(subtotalCents + shippingCents),
    };
  });
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function summarize(
  customers: Customer[],
  priced: PricedOrder[],
): InsightSummary {
  const known = new Set(customers.map((customer) => customer.id));
  for (const order of priced) {
    if (!known.has(order.customerId)) {
      throw new Error(`Unknown customer ${order.customerId} on ${order.id}`);
    }
  }

  const monthCents = new Map<string, number>();
  const ordersByCustomer = new Map<string, number>();
  const productCents = new Map<
    string,
    { name: string; category: string; units: number; cents: number }
  >();
  const channelCents = new Map<string, { orders: number; cents: number }>();

  for (const order of priced) {
    const month = order.orderedAt.slice(0, 7);
    monthCents.set(month, (monthCents.get(month) ?? 0) + cents(order.total));
    ordersByCustomer.set(
      order.customerId,
      (ordersByCustomer.get(order.customerId) ?? 0) + 1,
    );
    const channel = channelCents.get(order.channel) ?? { orders: 0, cents: 0 };
    channel.orders += 1;
    channel.cents += cents(order.total);
    channelCents.set(order.channel, channel);

    for (const item of order.items) {
      const current = productCents.get(item.productId) ?? {
        name: item.name,
        category: item.category,
        units: 0,
        cents: 0,
      };
      current.units += item.quantity;
      current.cents += cents(item.lineTotal);
      productCents.set(item.productId, current);
    }
  }

  const activeCustomers = ordersByCustomer.size;
  const repeatCustomers = [...ordersByCustomer.values()].filter(
    (count) => count > 1,
  ).length;
  const revenueCents = priced.reduce((sum, order) => sum + cents(order.total), 0);

  return {
    revenue: dollars(revenueCents),
    orderCount: priced.length,
    months: [...monthCents.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month,
        label: monthLabel(month),
        revenue: dollars(amount),
      })),
    repeatCustomers,
    activeCustomers,
    repeatRate: activeCustomers ? repeatCustomers / activeCustomers : 0,
    topProducts: [...productCents.entries()]
      .map(([productId, row]) => ({
        productId,
        name: row.name,
        category: row.category,
        units: row.units,
        revenue: dollars(row.cents),
      }))
      .sort((a, b) => b.revenue - a.revenue),
    channels: [...channelCents.entries()]
      .map(([channel, row]) => ({
        channel,
        orders: row.orders,
        revenue: dollars(row.cents),
        averageOrderValue: dollars(Math.round(row.cents / row.orders)),
      }))
      .sort((a, b) => a.channel.localeCompare(b.channel)),
  };
}
