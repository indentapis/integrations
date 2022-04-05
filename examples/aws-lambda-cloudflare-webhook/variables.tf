variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
}

variable "cloudflare_webhook_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "cloudflare_pull_webhook_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "cloudflare_account" {
  type      = string
  default   = ""
  sensitive = true
}

variable "cloudflare_token" {
  type      = string
  default   = ""
  sensitive = true
}