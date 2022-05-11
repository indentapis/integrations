output "okta_webhook_url" {
  value       = module.okta-webhook.function_url
  description = "The URL of the deployed AWS Lambda function"
}
