- dashboard: commerce_insights
  title: Cove Supply commerce insights
  description: Revenue, repeat customers, and top products from the BigQuery analytics tables.
  layout: newspaper
  preferred_viewer: dashboards-next
  filters:
  - name: ordered_date
    title: Order date
    type: field_filter
    model: cove_commerce
    explore: orders
    field: orders.ordered_date
    default_value: 6 months
  elements:
  - title: Revenue by month
    name: revenue_by_month
    model: cove_commerce
    explore: orders
    type: looker_column
    fields: [orders.ordered_month, orders.total_revenue]
    sorts: [orders.ordered_month]
    listen:
      ordered_date: orders.ordered_date
    row: 0
    col: 0
    width: 16
    height: 8
  - title: Repeat customer rate
    name: repeat_rate
    model: cove_commerce
    explore: customer_facts
    type: single_value
    fields: [customer_facts.repeat_rate]
    row: 0
    col: 16
    width: 8
    height: 8
  - title: Top products
    name: top_products
    model: cove_commerce
    explore: order_items
    type: looker_bar
    fields: [products.name, order_items.line_revenue]
    sorts: [order_items.line_revenue desc]
    limit: 8
    listen:
      ordered_date: orders.ordered_date
    row: 8
    col: 0
    width: 16
    height: 8
  - title: Average order value by channel
    name: aov_by_channel
    model: cove_commerce
    explore: orders
    type: looker_column
    fields: [orders.channel, orders.average_order_value]
    listen:
      ordered_date: orders.ordered_date
    row: 8
    col: 16
    width: 8
    height: 8
