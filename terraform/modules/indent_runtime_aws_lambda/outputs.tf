output "function_url" {
  value       = aws_lambda_function_url.function_url.function_url
  description = "The URL of the deployed Lambda"
}

output "function_role_name" {
  value       = aws_iam_role.lambda_role.name
  description = "The role name of the deployed Lambda"
}
