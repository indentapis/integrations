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

  statement {
    effect = "Allow"

    actions = [
      "iam:ListGroupsForUser",
      "iam:ListUsers",
      "iam:ListGroups",
      "iam:GetGroup",
      "iam:GetUser",
    ]

    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:*"]
  }
}

resource "aws_iam_policy" "lambda_policy" {
  policy = data.aws_iam_policy_document.lambda_document.json
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
