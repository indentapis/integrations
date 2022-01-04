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

variable "okta_domain" {
  type      = string
  sensitive = true
}

variable "okta_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "okta_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "okta_private_key" {
  type      = string
  sensitive = true
  default   = ""
}
