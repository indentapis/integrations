terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    region  = "us-west-2"
    key     = "indent/terraform.tfstate"
  }
}

module "okta-pull-webhook" {
  source = "./terraform-aws-okta-pull-webhook/terraform"

  indent_webhook_secret = var.indent_pull_webhook_secret
  okta_domain           = var.okta_domain
  okta_token            = var.okta_token
  okta_slack_app_id     = var.okta_slack_app_id
  okta_client_id        = var.okta_client_id
  okta_private_key      = var.okta_private_key
}

module "okta-change-webhook" {
  source = "./terraform-aws-okta-webhook/terraform"

  indent_webhook_secret = var.indent_webhook_secret
  okta_domain           = var.okta_domain
  okta_token            = var.okta_token
  okta_client_id        = var.okta_client_id
  okta_private_key      = var.okta_private_key
}
