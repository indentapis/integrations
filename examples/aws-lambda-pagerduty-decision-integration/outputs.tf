output "pagerduty_auto_approval_webhook_url" {
  value       = module.pagerduty_auto_approval_webhook.api_base_url
  description = "The URL of the deployed Lambda"
}
