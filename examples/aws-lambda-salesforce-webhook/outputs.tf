output "pull_api_base_url" {
  value       = module.salesforce-pull-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}

output "api_base_url" {
  value       = module.salesforce-change-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}
