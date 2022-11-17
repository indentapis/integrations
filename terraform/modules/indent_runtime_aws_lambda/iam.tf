data "aws_iam_policy_document" "lambda_assume_role_document" {
  version = "2012-10-17"

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    effect = "Allow"
  }
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_document" {
  version = "2012-10-17"

  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "cloudwatch:PutMetricData",
    ]

    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name}:*"]
  }
}


data "aws_iam_policy_document" "lambda_secrets_manager_document" {
  version = "2012-10-17"

  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.secrets_prefix}*"]
  }
}

resource "aws_iam_policy" "lambda_policy" {
  policy = data.aws_iam_policy_document.lambda_document.json
}

resource "aws_iam_policy" "lambda_secrets_manager_policy" {
  policy = data.aws_iam_policy_document.lambda_secrets_manager_document.json
}

resource "aws_iam_role" "lambda_role" {
  name               = "${local.name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_document.json

  tags = local.tags
}

resource "aws_iam_policy_attachment" "lambda_attachment" {
  name = "${local.name}-attachment"

  roles = [aws_iam_role.lambda_role.name]

  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_policy_attachment" "lambda_secrets_manager_attachment" {
  count = var.secrets_backend == "aws-secrets-manager" ? 1 : 0

  name = "${local.name}-secrets-manager-attachment"

  roles = [aws_iam_role.lambda_role.name]

  policy_arn = aws_iam_policy.lambda_secrets_manager_policy.arn
}
