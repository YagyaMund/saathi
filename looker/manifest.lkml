project_name: "cove_supply"

constant: bq_project {
  value: "REPLACE_WITH_PROJECT_ID"
  export: override_required
}

constant: bq_dataset {
  value: "cove_analytics"
  export: override_optional
}
