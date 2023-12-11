# terraform {
#   backend "s3" {
#     encrypt = true
#     bucket  = ""
#     region  = "us-west-2"
#     key     = "indent/terraform.tfstate"
#   }
# }

module "salesforce-pull-webhook" {
  source = "./terraform-aws-salesforce-webhook/terraform"

  indent_webhook_secret       = var.salesforce_pull_webhook_secret
  salesforce_instance_url     = var.salesforce_instance_url
  salesforce_access_token     = var.salesforce_access_token
}

module "salesforce-change-webhook" {
  source = "./terraform-aws-salesforce-webhook/terraform"

  indent_webhook_secret        = var.salesforce_webhook_secret
  salesforce_instance_url      = var.salesforce_instance_url
  salesforce_access_token      = var.salesforce_access_token
}
