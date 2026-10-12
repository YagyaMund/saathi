import Link from "next/link";

export function ItemsOrdersSeg({
  active,
  itemCount,
  orderCount,
}: {
  active: "items" | "orders";
  itemCount: number;
  orderCount: number;
}) {
  return (
    <div className="seg items-orders-seg" role="tablist" aria-label="Catalogue">
      <Link
        href="/app/items"
        className="seg-link"
        role="tab"
        aria-selected={active === "items"}
        data-active={active === "items" ? "true" : "false"}
      >
        Items · {itemCount}
      </Link>
      <Link
        href="/app/orders"
        className="seg-link"
        role="tab"
        aria-selected={active === "orders"}
        data-active={active === "orders" ? "true" : "false"}
      >
        Orders · {orderCount}
      </Link>
    </div>
  );
}
