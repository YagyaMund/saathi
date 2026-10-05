view: order_items {
  sql_table_name: `@{bq_project}.@{bq_dataset}.order_items` ;;

  dimension: order_item_id {
    primary_key: yes
    type: string
    sql: ${TABLE}.order_item_id ;;
  }

  dimension: order_id {
    type: string
    sql: ${TABLE}.order_id ;;
  }

  dimension: product_id {
    type: string
    sql: ${TABLE}.product_id ;;
  }

  dimension: quantity {
    type: number
    sql: ${TABLE}.quantity ;;
  }

  dimension: unit_price {
    type: number
    sql: ${TABLE}.unit_price ;;
    value_format_name: usd
  }

  dimension: line_total {
    type: number
    sql: ${TABLE}.line_total ;;
    value_format_name: usd
  }

  measure: units_sold {
    type: sum
    sql: ${TABLE}.quantity ;;
  }

  measure: line_revenue {
    type: sum
    sql: ${TABLE}.line_total ;;
    value_format_name: usd
    description: "Merchandise revenue. Shipping is not included."
  }

  measure: gross_margin {
    type: sum
    sql: ${line_total} - (${quantity} * ${products.cost}) ;;
    value_format_name: usd
  }
}
