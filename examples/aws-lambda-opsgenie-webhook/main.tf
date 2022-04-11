terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    key     = "indent/terraform.tfstate"
  }
}

module "opsgenie-auto-approval-webhook" {
  source = "./terraform"

  aws_region            = var.aws_region
  indent_webhook_secret = var.indent_pull_webhook_secret
  opsgenie_key          = var.opsgenie_key
}
