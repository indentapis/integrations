provider "aws" {
  profile     = var.aws_profile
  region      = var.aws_region
  max_retries = 1
}

terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
    }

    aws = {
      version = "~> 3.0"
    }
  }
}
