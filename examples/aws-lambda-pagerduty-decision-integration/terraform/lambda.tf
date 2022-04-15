data "archive_file" "function_archive" {
  type        = "zip"
  source_dir  = "${path.module}/../lib"
  output_path = "${path.module}/../dist/function.zip"
}

resource "aws_lambda_layer_version" "deps" {
  compatible_runtimes = ["nodejs14.x"]
  layer_name          = "${local.name}-dependency_layer"
  filename            = "${path.module}/../dist/layers/layers.zip"
  source_code_hash    = filesha256("${path.module}/../dist/layers/layers.zip")
}

resource "aws_lambda_function" "lambda" {
  function_name    = local.name
  role             = aws_iam_role.lambda_role.arn
  filename         = data.archive_file.function_archive.output_path
  source_code_hash = data.archive_file.function_archive.output_base64sha256
  memory_size      = local.lambda_memory
  handler          = "index.handle"
  runtime          = "nodejs14.x"
  timeout          = "30"

  layers = [aws_lambda_layer_version.deps.arn]

  environment {
    variables = {
      "INDENT_WEBHOOK_SECRET" = var.indent_webhook_secret
      "PAGERDUTY_KEY"         = var.pagerduty_key
    }
  }
}

resource "aws_lambda_function_url" "function_url" {
  function_name      = aws_lambda_function.lambda.function_name
  authorization_type = "NONE"
}
