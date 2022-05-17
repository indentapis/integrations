terraform {
  backend "s3" {
    encrypt = true
    bucket  = "indent-terraform-state"
    region  = "us-west-2"
    key     = "indent/terraform.tfstate"
  }
}

module "okta-webhook" {
  source = "git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda"

  name                  = "idt-okta-webhook"
  indent_webhook_secret = var.indent_webhook_secret

  artifact = {
    bucket = "indent-artifacts-us-west-2"

    function_key = "webhooks/aws/lambda/okta-v0.0.1-canary-function.zip"
    deps_key     = "webhooks/aws/lambda/okta-v0.0.1-canary-deps.zip"
  }

  env = {
    OKTA_DOMAIN       = var.okta_domain
    OKTA_TOKEN        = var.okta_token
    OKTA_SLACK_APP_ID = var.okta_slack_app_id
    OKTA_CLIENT_ID    = var.okta_client_id
    OKTA_PRIVATE_KEY  = var.okta_private_key
  }
}
