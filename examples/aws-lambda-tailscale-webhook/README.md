# Indent + AWS and Tailscale Webhooks

This repository contains two webhooks (AWS Lambdas) to pull and apply updates to Tailscale Groups using [Indent](https://indent.com/docs).

## Configuration

Before you deploy these webhooks for the first time, [create an S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html) to use to store Terraform state, add your credentials as [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### Actions secrets

Add the credentials below to your GitHub Secrets:

| Name                          | Value                                                                                                                                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TAILSCALE_WEBHOOK_SECRET      | Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard.                                                                       |
| TAILSCALE_PULL_WEBHOOK_SECRET | Get this from the [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups#step-1-deploy-the-pull-update-webhook) you created while setting up your space.                                                                                               |
| TAILSCALE_API_KEY             | Your Tailscale API Key. Get this from your [Tailscale Administrator Panel](https://login.tailscale.com/admin/settings/keys).                                                                                                                                         |
| TAILSCALE_TAILNET             | The name of your Tailscale network. The network you want to manage with Indent.                                                                                                                                                                                      |
| AWS_REGION                    | The AWS Region where you want to deploy the webhooks.                                                                                                                                                                                                                |
| AWS_ACCESS_KEY_ID             | [Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                      |
| AWS_SECRET_ACCESS_KEY         | [Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                  |
| AWS_SESSION_TOKEN             | Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires** |

## Deployment

This repository auto-deploys to AWS when you push or merge PRs to the `main` branch. You can manually redeploy the webhooks by re-running the [latest GitHub Action job](https://docs.github.com/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).
