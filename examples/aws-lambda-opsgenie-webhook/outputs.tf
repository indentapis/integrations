output "opsgenie_auto_approval_webhook_url" {
  value       = module.opsgenie-auto-approval-webhook.function_url
  description = "The URL of the deployed AWS Lambda function"
}
