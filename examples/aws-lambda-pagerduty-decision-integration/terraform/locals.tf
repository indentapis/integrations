locals {
  name          = "indent-pagerduty-webhook-${random_string.suffix.result}"
  lambda_memory = 128

  tags = {
    Name       = "Indent + PagerDuty on AWS via Terraform"
    GitRepo    = "https://github.com/indentapis/integrations"
    ProvidedBy = "Indent"
  }
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}
