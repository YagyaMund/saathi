view: customer_facts {
  derived_table: {
    sql:
      SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(total) AS lifetime_revenue
      FROM `@{bq_project}.@{bq_dataset}.orders`
      GROUP BY 1 ;;
  }

  dimension: customer_id {
    primary_key: yes
    type: string
    sql: ${TABLE}.customer_id ;;
  }

  dimension: order_count {
    type: number
    sql: ${TABLE}.order_count ;;
  }

  dimension: is_repeat {
    type: yesno
    sql: ${TABLE}.order_count > 1 ;;
  }

  dimension: lifetime_revenue {
    type: number
    sql: ${TABLE}.lifetime_revenue ;;
    value_format_name: usd
  }

  measure: customers {
    type: count
  }

  measure: repeat_customers {
    type: count
    filters: [is_repeat: "yes"]
  }

  measure: repeat_rate {
    type: number
    sql: 1.0 * ${repeat_customers} / NULLIF(${customers}, 0) ;;
    value_format_name: percent_1
  }

  measure: lifetime_revenue_total {
    type: sum
    sql: ${TABLE}.lifetime_revenue ;;
    value_format_name: usd
  }
}
