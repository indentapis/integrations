variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
}

variable "secrets_prefix" {
  type    = string
  default = "idt-"
}

variable "secrets_backend" {
  type    = string
  default = "env-var"

  validation {
    condition     = length(regexall("^(aws-secrets-manager|env-var)$", var.secrets_backend)) > 0
    error_message = "ERROR: Valid backends are \"aws-secrets-manager\" and \"env-var\"!"
  }
}

variable "name" {
  type    = string
  default = "idt-custom-webhook"
}

variable "indent_webhook_secret" {
  type      = string
  sensitive = true
}

variable "env" {
  type      = map(string)
  sensitive = true
  default   = {}
}

variable "artifact" {
  type = object({
    bucket       = string
    function_key = string
    deps_key     = string
  })
}

variable "timeout" {
  type    = number
  default = 120
}


variable "lambda_runtime" {
  type    = string
  default = "nodejs14.x"
}