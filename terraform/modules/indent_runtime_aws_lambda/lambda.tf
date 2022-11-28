locals {
  # https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html#retrieving-secrets_lambda_ARNs
  secrets_lambda_extension_layer_arn = {
    "us-east-1" : "arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
    "us-east-2" : "arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
    "us-west-1" : "arn:aws:lambda:us-west-1:997803712105:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
    "us-west-2" : "arn:aws:lambda:us-west-2:345057560386:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
  }

  helper_layers = var.secrets_backend == "aws-secrets-manager" ? [local.secrets_lambda_extension_layer_arn[var.aws_region]] : []
}

resource "aws_lambda_layer_version" "deps" {
  compatible_runtimes = ["nodejs14.x"]
  layer_name          = "${local.name}-dependency_layer"
  s3_bucket           = var.artifact.bucket
  s3_key              = var.artifact.deps_key
}

resource "aws_lambda_function" "lambda" {
  function_name = local.name
  role          = aws_iam_role.lambda_role.arn
  s3_bucket     = var.artifact.bucket
  s3_key        = var.artifact.function_key
  memory_size   = local.lambda_memory
  handler       = "index.handle"
  runtime       = "nodejs14.x"
  timeout       = var.timeout

  layers = concat(
    local.helper_layers,
    [aws_lambda_layer_version.deps.arn]
  )

  environment {
    variables = merge(var.env, {
      "INDENT_WEBHOOK_SECRET" = var.indent_webhook_secret,
      "SECRETS_BACKEND"       = var.secrets_backend
    })
  }
}

resource "aws_lambda_function_url" "function_url" {
  function_name      = aws_lambda_function.lambda.function_name
  authorization_type = "NONE"
}
