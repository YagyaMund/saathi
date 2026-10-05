view: customers {
  sql_table_name: `@{bq_project}.@{bq_dataset}.customers` ;;

  dimension: customer_id {
    primary_key: yes
    type: string
    sql: ${TABLE}.customer_id ;;
  }

  dimension: email {
    type: string
    sql: ${TABLE}.email ;;
  }

  dimension: full_name {
    type: string
    sql: ${TABLE}.full_name ;;
  }

  dimension: city {
    type: string
    sql: ${TABLE}.city ;;
  }

  dimension: region {
    type: string
    sql: ${TABLE}.region ;;
  }

  dimension: segment {
    type: string
    sql: ${TABLE}.segment ;;
  }

  dimension_group: created {
    type: time
    timeframes: [raw, date, week, month]
    datatype: timestamp
    sql: ${TABLE}.created_at ;;
  }

  measure: customer_count {
    type: count
    drill_fields: [full_name, city, segment]
  }
}
