# Indent + AWS Okta Webhooks

This repository contains two webhooks (AWS Lambdas) to pull and apply updates to Okta Group using [Indent](https://indent.com/docs).

## Configuration

Before you deploy these webhooks for the first time, [create an S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html) to use to store Terraform state, add your credentials as [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets), then update the bucket in [`main.tf`](https://github.com/indent-shared/template-terraform-aws-okta/blob/main/main.tf#L4).

### Actions secrets

Add the credentials for one of the authentication options below to your GitHub Secrets.

<details open><summary>Option 1: Okta Admin API Token</summary>
<p>

| Name                       | Value                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INDENT_WEBHOOK_SECRET      | Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard                                                                                                                                         |
| INDENT_PULL_WEBHOOK_SECRET | Get this from the [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups#step-1-deploy-the-pull-update-webhook) you created while setting up your space                                                                                                                                                                 |
| OKTA_DOMAIN                | Your Okta Domain. This is your [Okta URL](https://developer.okta.com/docs/guides/find-your-domain/findorg/) like `example.okta.com`                                                                                                                                                                                                   |
| OKTA_TOKEN                 | Your [Okta API Token](https://developer.okta.com/docs/guides/create-an-api-token/overview/). Get this from your Administrator. Your token needs the ["Group Administrators"](https://help.okta.com/en/prod/Content/Topics/Security/administrators-group-admin.htm) scope or higher for \_every\* group you plan to manage with Indent |
| OKTA_SLACK_APP_ID          | Your Okta Slack App ID. Go to _Okta Admin Console_ &rarr; _Applications_ &rarr; Select "Slack" and copy the value from the URL, e.g. `0oabcdefghijklmnop` from `example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/`                                                                                                          |
| AWS_REGION                 | The AWS Region where you want to deploy the webhooks                                                                                                                                                                                                                                                                                  |
| AWS_ACCESS_KEY_ID          | [Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                                                                                       |
| AWS_SECRET_ACCESS_KEY      | [Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                                                                                   |
| AWS_SESSION_TOKEN          | Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires**                                                                  |

</p>
</details>

<details><summary>Option 2: Okta OAuth2.0 Service App</summary>
<p>

Create an Okta Service App based on our [guide](https://indent.com/docs/integrations/okta#option-2-service-app-with-api-scopes).

| Name                       | Description                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INDENT_WEBHOOK_SECRET      | Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard                                                                        |
| INDENT_PULL_WEBHOOK_SECRET | Get this from the [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups#step-1-deploy-the-pull-update-webhook) you created while setting up your space                                                                                                |
| OKTA_DOMAIN                | Your Okta Domain. This is your [Okta URL](https://developer.okta.com/docs/guides/find-your-domain/findorg/) like `example.okta.com`                                                                                                                                  |
| OKTA_CLIENT_ID             | Your Service App's Client ID. Get this from the Okta Admin Dashboard or from the Okta API Response value you got when settting up your app                                                                                                                           |
| OKTA_PRIVATE_KEY           | The private RSA key you used to create your Service App                                                                                                                                                                                                              |
| OKTA_SLACK_APP_ID          | Your Okta Slack App ID. Go to _Okta Admin Console_ &rarr; _Applications_ &rarr; Select "Slack" and copy the value from the URL, e.g. `0oabcdefghijklmnop` from `example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/`                                         |
| AWS_REGION                 | The AWS Region where you want to deploy the webhooks                                                                                                                                                                                                                 |
| AWS_ACCESS_KEY_ID          | [Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                      |
| AWS_SECRET_ACCESS_KEY      | [Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                  |
| AWS_SESSION_TOKEN          | Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires** |

</p>
</details>

## Deployment

This repository auto-deploys to AWS when you push or merge PRs to the `main` branch. You can manually redeploy the webhooks by re-running the [latest GitHub Action job](https://docs.github.com/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).
