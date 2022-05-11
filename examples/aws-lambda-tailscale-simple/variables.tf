variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
}

variable "tailscale_webhook_secret" {
  type      = string
  sensitive = true
}

variable "tailscale_pull_webhook_secret" {
  type      = string
  sensitive = true
}

variable "tailscale_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "tailscale_tailnet" {
  type      = string
  default   = ""
  sensitive = true
}
