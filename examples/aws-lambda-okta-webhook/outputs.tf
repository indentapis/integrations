output "pull_api_base_url" {
  value       = module.okta-pull-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}

output "api_base_url" {
  value       = module.okta-change-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}
