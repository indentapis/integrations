output "tailscale_webhook_url" {
  value       = module.tailscale-webhook.function_url
  description = "The URL of the deployed AWS Lambda function"
}
