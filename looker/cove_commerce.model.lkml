# Connect this LookML project to an existing Looker instance.
# Do not provision Looker Core from Terraform. See the repository README.
#
# In Looker Admin, create a BigQuery connection named cove_bigquery
# in the same project as cove_analytics. Then set the bq_project constant
# in manifest.lkml to that project id (or override it in the manifest lock).

connection: "cove_bigquery"

include: "/views/*.view.lkml"
include: "/dashboards/*.dashboard.lookml"

explore: orders {
  description: "Revenue and average order value."
  join: customers {
    type: left_outer
    sql_on: ${orders.customer_id} = ${customers.customer_id} ;;
    relationship: many_to_one
  }
}

explore: order_items {
  description: "Merchandise revenue by product."
  join: products {
    type: left_outer
    sql_on: ${order_items.product_id} = ${products.product_id} ;;
    relationship: many_to_one
  }
  join: orders {
    type: left_outer
    sql_on: ${order_items.order_id} = ${orders.order_id} ;;
    relationship: many_to_one
  }
}

explore: customer_facts {
  description: "Repeat customers over the loaded order history."
  join: customers {
    type: left_outer
    sql_on: ${customer_facts.customer_id} = ${customers.customer_id} ;;
    relationship: one_to_one
  }
}
