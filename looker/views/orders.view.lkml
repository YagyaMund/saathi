view: orders {
  sql_table_name: `@{bq_project}.@{bq_dataset}.orders` ;;

  dimension: order_id {
    primary_key: yes
    type: string
    sql: ${TABLE}.order_id ;;
  }

  dimension: customer_id {
    type: string
    sql: ${TABLE}.customer_id ;;
  }

  dimension: status {
    type: string
    sql: ${TABLE}.status ;;
  }

  dimension: channel {
    type: string
    sql: ${TABLE}.channel ;;
  }

  dimension: subtotal {
    type: number
    sql: ${TABLE}.subtotal ;;
    value_format_name: usd
  }

  dimension: shipping {
    type: number
    sql: ${TABLE}.shipping ;;
    value_format_name: usd
  }

  dimension: total {
    type: number
    sql: ${TABLE}.total ;;
    value_format_name: usd
  }

  dimension_group: ordered {
    type: time
    timeframes: [raw, date, week, month, quarter, year]
    datatype: timestamp
    sql: ${TABLE}.ordered_at ;;
  }

  measure: order_count {
    type: count
    drill_fields: [order_id, ordered_date, channel, total]
  }

  measure: total_revenue {
    type: sum
    sql: ${TABLE}.total ;;
    value_format_name: usd
    description: "Order total, including web shipping."
  }

  measure: average_order_value {
    type: number
    sql: ${total_revenue} / NULLIF(${order_count}, 0) ;;
    value_format_name: usd
    description: "Sum of order totals divided by order count."
  }
}
