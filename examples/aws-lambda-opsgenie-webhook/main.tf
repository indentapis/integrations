terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    region  = "us-west-2"
    key     = "indent/terraform.tfstate"
  }
}

module "opsgenie-auto-approval-webhook" {
  source = "./terraform"

  indent_webhook_secret = var.indent_pull_webhook_secret
  opsgenie_key          = var.opsgenie_key
}
