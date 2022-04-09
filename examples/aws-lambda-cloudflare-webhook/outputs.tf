output "pull_api_base_url" {
  value       = module.cloudflare-pull-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}

output "api_base_url" {
  value       = module.cloudflare-change-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}
