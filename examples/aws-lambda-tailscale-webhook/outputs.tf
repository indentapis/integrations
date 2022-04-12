output "tailscale_pull_webhook_url" {
  value       = module.tailscale-pull-webhook.api_base_url
  description = "The URL of the deployed AWS Lambda function"
}

output "tailscale_change_webhook_url" {
  value       = module.tailscale-change-webhook.api_base_url
  description = "The URL of the deployed Lambda"
}
