variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
}

variable "salesforce_webhook_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "salesforce_pull_webhook_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "salesforce_instance_url" {
  type      = string
  default   = ""
  sensitive = true
}

variable "salesforce_access_token" {
  type      = string
  default   = ""
  sensitive = true
}