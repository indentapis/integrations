terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    key     = "indent/terraform.tfstate"
  }
}

module "pagerduty-auto-approval-webhook" {
  source = "./terraform"

  aws_region            = var.aws_region
  indent_webhook_secret = var.indent_pull_webhook_secret
  pagerduty_key         = var.pagerduty_key
}
