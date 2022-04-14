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
  default   = ""
}

variable "pagerduty_key" {
  type      = string
  sensitive = true
  default   = ""
}
