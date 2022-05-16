output "example_webhook_url" {
  value       = module.example-webhook.function_url
  description = "The URL of the deployed AWS Lambda function"
}
