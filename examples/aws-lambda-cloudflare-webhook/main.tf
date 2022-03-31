# terraform {
#   backend "s3" {
#     encrypt = true
#     bucket  = ""
#     region  = "us-west-2"
#     key     = "indent/terraform.tfstate"
#   }
# }

module "cloudflare-pull-webhook" {
  source = "./terraform-aws-cloudflare-webhook/terraform"

  indent_webhook_secret    = var.cloudflare_pull_webhook_secret
  cloudflare_account       = var.cloudflare_account
  cloudflare_account_email = var.cloudflare_account_email
  cloudflare_token         = var.cloudflare_token
}

module "cloudflare-change-webhook" {
  source = "./terraform-aws-cloudflare-webhook/terraform"

  indent_webhook_secret    = var.cloudflare_pull_webhook_secret
  cloudflare_account       = var.cloudflare_account
  cloudflare_account_email = var.cloudflare_account_email
  cloudflare_token         = var.cloudflare_token
}
