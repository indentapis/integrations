variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
}

variable "indent_webhook_secret" {
  type      = string
  sensitive = true
}

variable "tailscale_api_key" {
  description = "Your Tailscale API Key"
  type        = string
  sensitive   = true
}

variable "tailscale_tailnet" {
  description = "The Tailnet where you want to manage ACLs"
  type        = string
  sensitive   = true
}

