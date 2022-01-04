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

variable "indent_pull_webhook_secret" {
  type      = string
  sensitive = true
}

variable "okta_domain" {
  type      = string
  sensitive = true
}

variable "okta_token" {
  type      = string
  default   = ""
  sensitive = true
}

variable "okta_client_id" {
  type      = string
  default   = ""
  sensitive = true
}

variable "okta_private_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "okta_slack_app_id" {
  type      = string
  default   = ""
  sensitive = true
}
