terraform {
  backend "s3" {
    encrypt = true
    bucket  = ""
    region  = "us-west-2"
    key     = "indent/terraform.tfstate"
  }
}

module "tailscale-pull-webhook" {
  source = "./terraform"

  indent_webhook_secret = var.tailscale_pull_webhook_secret
  tailscale_api_key     = var.tailscale_api_key
  tailscale_tailnet     = var.tailscale_tailnet
}

module "tailscale-change-webhook" {
  source = "./terraform"

  indent_webhook_secret = var.tailscale_pull_webhook_secret
  tailscale_api_key     = var.tailscale_api_key
  tailscale_tailnet     = var.tailscale_tailnet
}
