import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localCatalog, localWarehouse } from "@/lib/local-data";
import { priceOrders, summarize } from "@/lib/metrics";
import { moneyExact, percent } from "@/lib/money";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights",
  description: "Revenue, repeat customers, and top products from the Cove warehouse fixture.",
};

export default function InsightsPage() {
  const summary = summarize(
    localWarehouse.customers,
    priceOrders(localCatalog, localWarehouse.orders),
  );
  const peak = Math.max(...summary.months.map((month) => month.revenue));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm tracking-wide text-copper uppercase">BigQuery and Looker</p>
      <h1 className="mt-3 font-heading text-4xl sm:text-5xl">How the season sold</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        These figures are the local warehouse fixture for January through June 2026. The same
        questions are in <span className="text-foreground">analytics/queries.sql</span> and in the
        LookML dashboard. Looker is not provisioned from this repo.
      </p>
      <Badge variant="secondary" className="mt-4">
        Local fixture · not a live BigQuery job
      </Badge>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="font-heading text-3xl">{moneyExact(summary.revenue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summary.orderCount} fulfilled orders, shipping included.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Repeat customers</CardDescription>
            <CardTitle className="font-heading text-3xl">{percent(summary.repeatRate)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summary.repeatCustomers} of {summary.activeCustomers} customers ordered more than once.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Top product</CardDescription>
            <CardTitle className="font-heading text-3xl">{summary.topProducts[0]?.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {moneyExact(summary.topProducts[0]?.revenue ?? 0)} in merchandise, before shipping.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Web average order</CardDescription>
            <CardTitle className="font-heading text-3xl">
              {moneyExact(summary.channels.find((channel) => channel.channel === "web")?.averageOrderValue ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Store average is{" "}
            {moneyExact(
              summary.channels.find((channel) => channel.channel === "store")?.averageOrderValue ?? 0,
            )}
            .
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
            <CardDescription>Order total, including the $8 web shipping charge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.months.map((month) => (
              <div key={month.month} className="grid grid-cols-[2.5rem_1fr_5.5rem] items-center gap-3 text-sm">
                <span className="text-muted-foreground">{month.label.slice(0, 3)}</span>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.max(8, (month.revenue / peak) * 100)}%` }}
                  />
                </div>
                <span className="text-right">{moneyExact(month.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average order value</CardTitle>
            <CardDescription>Sum of order totals divided by order count.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.channels.map((channel) => (
              <div key={channel.channel} className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="capitalize">{channel.channel}</p>
                  <p className="text-sm text-muted-foreground">{channel.orders} orders</p>
                </div>
                <p className="font-heading text-2xl">{moneyExact(channel.averageOrderValue)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Top products</CardTitle>
          <CardDescription>Merchandise revenue from order lines. Shipping is not included.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 text-right font-medium">Units</th>
                <th className="py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {summary.topProducts.slice(0, 6).map((product) => (
                <tr key={product.productId} className="border-b border-border/70 last:border-0">
                  <td className="py-3">{product.name}</td>
                  <td className="py-3 text-muted-foreground">{product.category}</td>
                  <td className="py-3 text-right">{product.units}</td>
                  <td className="py-3 text-right">{moneyExact(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
