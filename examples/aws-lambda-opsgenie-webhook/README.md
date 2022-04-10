# Indent + OpsGenie Webhooks

This repository contains two webhooks (AWS Lambdas) to pull and apply updates to Okta Group using [Indent](https://indent.com/docs).

## Configuration

Before you deploy these webhooks for the first time, [create an S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html) to use to store Terraform state, add your credentials as [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets), then update the bucket in `main.tf`.

### Actions secrets

Add the credentials for one of the authentication options below to your GitHub Secrets.

<details open><summary>Configuring secrets / environment variables</summary>
<p>

| Name                  | Value                                                                                                                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INDENT_WEBHOOK_SECRET | Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps) or an [Indent Webhook](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/webhooks) in the Dashboard                                                          |
| AWS_REGION            | The AWS Region where you want to deploy the webhooks                                                                                                                                                                                                                 |
| AWS_ACCESS_KEY_ID     | [Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                      |
| AWS_SECRET_ACCESS_KEY | [Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                  |
| AWS_SESSION_TOKEN     | Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires** |

</p>
</details>

## Deployment

This repository auto-deploys to AWS when you push or merge PRs to the `main` branch. You can manually redeploy the webhooks by re-running the [latest GitHub Action job](https://docs.github.com/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).
