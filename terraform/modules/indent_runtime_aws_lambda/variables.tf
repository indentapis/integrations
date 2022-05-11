variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
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
