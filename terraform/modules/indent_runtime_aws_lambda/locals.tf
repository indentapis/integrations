locals {
  name          = "${var.name}-${random_string.suffix.result}"
  lambda_memory = 128

  tags = {
    GitRepo    = "https://github.com/indentapis/integrations"
    ProvidedBy = "Indent"
  }
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  special = false
}
