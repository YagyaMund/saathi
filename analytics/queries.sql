-- Cove Supply analysis questions.
-- Run in the project after terraform apply and analytics/seed.sql.
-- Revenue includes shipping. Product revenue is merchandise only.
-- Average order value is SUM(total) / COUNT(*), which matches the insights page.

-- 1. Revenue by month
SELECT
  FORMAT_TIMESTAMP('%Y-%m', ordered_at) AS month,
  ROUND(SUM(total), 2) AS revenue,
  COUNT(*) AS orders
FROM `cove_analytics.orders`
GROUP BY month
ORDER BY month;

-- 2. Repeat customer rate
-- A repeat customer has more than one fulfilled order.
WITH counts AS (
  SELECT customer_id, COUNT(*) AS orders
  FROM `cove_analytics.orders`
  GROUP BY customer_id
)
SELECT
  COUNTIF(orders > 1) AS repeat_customers,
  COUNT(*) AS active_customers,
  ROUND(COUNTIF(orders > 1) / COUNT(*), 4) AS repeat_rate
FROM counts;

-- 3. Top products by merchandise revenue
SELECT
  p.product_id,
  p.name,
  p.category,
  SUM(i.quantity) AS units,
  ROUND(SUM(i.line_total), 2) AS revenue
FROM `cove_analytics.order_items` AS i
JOIN `cove_analytics.products` AS p
  ON p.product_id = i.product_id
GROUP BY p.product_id, p.name, p.category
ORDER BY revenue DESC;

-- 4. Average order value by channel
SELECT
  channel,
  COUNT(*) AS orders,
  ROUND(SUM(total), 2) AS revenue,
  ROUND(SUM(total) / COUNT(*), 2) AS average_order_value
FROM `cove_analytics.orders`
GROUP BY channel
ORDER BY channel;

-- 5. Gross margin by category
-- Product cost is 42% of list price in the fixture.
SELECT
  p.category,
  ROUND(SUM(i.line_total), 2) AS revenue,
  ROUND(SUM(i.quantity * p.cost), 2) AS cost,
  ROUND(SUM(i.line_total) - SUM(i.quantity * p.cost), 2) AS gross_margin
FROM `cove_analytics.order_items` AS i
JOIN `cove_analytics.products` AS p
  ON p.product_id = i.product_id
GROUP BY p.category
ORDER BY gross_margin DESC;
