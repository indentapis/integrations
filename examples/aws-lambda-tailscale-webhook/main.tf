terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    region  = "us-west-2"
    key     = "indent/terraform.tfstate"
  }
}

module "tailscale-webhook" {
  source = "github.com/indentapis/integrations//modules/indent_runtime_aws_lambda"

  name                  = "idt-tailscale-webhook"
  indent_webhook_secret = var.indent_webhook_secret

  artifact = {
    bucket = "indent-artifacts-us-west-2"

    function_key = "webhooks/aws/lambda/tailscale-v0.0.1-canary-function.zip"
    deps_key     = "webhooks/aws/lambda/tailscale-v0.0.1-canary-deps.zip"
  }

  env = {
    TAILSCALE_API_KEY = var.tailscale_api_key
    TAILSCALE_TAILNET = var.tailscale_tailnet
  }
}
