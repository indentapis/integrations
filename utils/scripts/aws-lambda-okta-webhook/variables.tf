variable "aws_region" {
  type    = string
  default = ""
}

variable "aws_profile" {
  type    = string
  default = ""
}

variable "indent_webhook_secret" {
  type      = string
  sensitive = true
}

variable "OKTA_DOMAIN" {
  type      = string
  default   = ""
  sensitive = true
}

variable "OKTA_TOKEN" {
  type      = string
  default   = ""
  sensitive = true
}

variable "OKTA_SLACK_APP_ID" {
  type      = string
  default   = ""
  sensitive = true
}

variable "OKTA_CLIENT_ID" {
  type      = string
  default   = ""
  sensitive = true
}

variable "OKTA_PRIVATE_KEY" {
  type      = string
  default   = ""
  sensitive = true
}

