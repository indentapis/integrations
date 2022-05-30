terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    region  = "us-west-2"
    key     = "indent/terraform.tfstate"
  }
}

module "example-webhook" {
  source = "git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda"

  name                  = "idt-example-webhook"
  indent_webhook_secret = var.indent_webhook_secret

  artifact = {
    bucket = "indent-artifacts-us-west-2"

    function_key = "webhooks/aws/lambda/example-v0.0.1-canary-function.zip"
    deps_key     = "webhooks/aws/lambda/example-v0.0.1-canary-deps.zip"
  }

  env = {
    # replaceme:env start
    PAGERDUTY_KEY = var.pagerduty_key
    # replacemen:env end
  }
}
