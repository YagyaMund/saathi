-- Reference DDL for the Cove analytics warehouse.
-- Terraform creates the dataset cove_analytics and these tables on apply.
-- Run this file only if you are creating the tables by hand in the same project.
-- Location must match the Vertex connection (the Terraform region, default us-central1).

CREATE SCHEMA IF NOT EXISTS cove_analytics;

CREATE TABLE IF NOT EXISTS `cove_analytics.customers` (
  customer_id STRING NOT NULL,
  email STRING NOT NULL,
  full_name STRING NOT NULL,
  city STRING,
  region STRING,
  segment STRING,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `cove_analytics.products` (
  product_id STRING NOT NULL,
  name STRING NOT NULL,
  category STRING NOT NULL,
  price NUMERIC NOT NULL,
  cost NUMERIC
);

CREATE TABLE IF NOT EXISTS `cove_analytics.orders` (
  order_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  ordered_at TIMESTAMP NOT NULL,
  status STRING,
  channel STRING,
  subtotal NUMERIC,
  shipping NUMERIC,
  total NUMERIC
)
PARTITION BY DATE(ordered_at);

CREATE TABLE IF NOT EXISTS `cove_analytics.order_items` (
  order_item_id STRING NOT NULL,
  order_id STRING NOT NULL,
  product_id STRING NOT NULL,
  quantity INT64 NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL
);
