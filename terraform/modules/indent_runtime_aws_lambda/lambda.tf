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

  layers = [aws_lambda_layer_version.deps.arn]

  environment {
    variables = merge(var.env, {
      "INDENT_WEBHOOK_SECRET" = var.indent_webhook_secret
    })
  }
}

resource "aws_lambda_function_url" "function_url" {
  function_name      = aws_lambda_function.lambda.function_name
  authorization_type = "NONE"
}
