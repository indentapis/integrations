# Indent + {{ runtime }} and {{ integration }}

This repository contains {{ numIntegrations }} webhooks (AWS Lambdas) to pull and apply updates to Okta Group using [Indent](https://indent.com/docs).

## Quicklinks

- [Indent Support](https://support.indent.com)
- [GitHub Secrets](./settings/secrets/actions)
- [GitHub Actions](./actions/workflows/terraform.yml)

## Configuration

Before you deploy these webhooks for the first time, [create an S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html) to store Terraform state, add your credentials as [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets), then update the bucket in `main.tf` once you're done.

<details><summary><strong>1. Configuring the S3 bucket</strong></summary>
<p>

- [Go to AWS S3](https://s3.console.aws.amazon.com/s3/buckets) and select an existing bucket or create a new one.
- Select the settings given your environment:
  - Name — easily identifiable name for the bucket (example = indent-deploy-state-123)
  - Region — where you plan to deploy the Lambda (default = us-west-2)
  - Bucket versioning — if you want to have revisions of past deployments (default = disabled)
  - Default encryption — server-side encryption for deployment files (default = Enable)

</p>
</details>

<details><summary><strong>2. Configuring AWS credentials</strong></summary>
<p>

- [Go to AWS IAM → New User](https://console.aws.amazon.com/iam/home#/users$new?step=details) and create a new user for deploys, e.g. `indent-terraform-deployer`
- Configure the service account access:
  - Credential type — select **Access key - Programmatic access**
  - Permissions — select **Attach existing policies directly** and select `AdministratorAccess`
- Add the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub Secrets to this repo

</p>
</details>

<details><summary><strong>3. Connecting to {{ integration }}</strong></summary>

{{{ connection }}}

</details>

<details><summary><strong>4. Connecting to Indent</strong></summary>

- If you're setting up as part of a catalog flow, you should be presented a **Webhook Secret** or [go to your Indent space and create a webhook](https://indent.com/spaces?next=/manage/spaces/[space]/webhooks/new)
- Add this as `INDENT_WEBHOOK_SECRET` as a GitHub Secret

</details>

<details><summary><strong>5. Deploy</strong></summary>

- Enter the bucket you created in `main.tf` in the `backend` configuration
- This will automatically kick off a deploy, or you can [manually trigger from GitHub Actions](./actions/workflows/terraform.yml)

</details>

### Actions secrets

Add the credentials for one of the authentication options below to your GitHub Secrets.

<details open><summary>Option 1: Okta Admin API Token</summary>
<p>

| Name                     | Value                                                                                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INDENT_WEBHOOK_SECRET    | Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard                                                                        |
| {{{ secretOne.name}}}    | {{{ secretOne.description}}}                                                                                                                                                                                                                                         |
| {{{ secretTwo.name }}}   | {{{ secretTwo.description }}}                                                                                                                                                                                                                                        |
| {{{ secretThree.name }}} | {{{ secretThree.description}}}                                                                                                                                                                                                                                       |
| AWS_REGION               | The AWS Region where you want to deploy the webhooks                                                                                                                                                                                                                 |
| AWS_ACCESS_KEY_ID        | [Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                      |
| AWS_SECRET_ACCESS_KEY    | [Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                  |
| AWS_SESSION_TOKEN        | Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires** |

</p>
</details>

<details><summary>Option 2: Okta OAuth2.0 Service App</summary>
<p>

Create an Okta Service App based on our [guide](https://indent.com/docs/integrations/okta#option-2-service-app-with-api-scopes).

| Name                     | Description                                                                                                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INDENT_WEBHOOK_SECRET    | Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard                                                                        |
| {{{ secretOne.name }}}   | {{{ secretOne.description }}}                                                                                                                                                                                                                                        |
| {{{ secretFour.name }}}  | {{{ secretFour.description }}}                                                                                                                                                                                                                                       |
| {{{ secretFive.name }}}  | {{{ secretFive.description }}}                                                                                                                                                                                                                                       |
| {{{ secretThree.name }}} | {{{ secretThree.description }}}                                                                                                                                                                                                                                      |
| AWS_REGION               | The AWS Region where you want to deploy the webhooks                                                                                                                                                                                                                 |
| AWS_ACCESS_KEY_ID        | [Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                      |
| AWS_SECRET_ACCESS_KEY    | [Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)                                                                                                                  |
| AWS_SESSION_TOKEN        | Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires** |

</p>
</details>

## Deployment

This repository auto-deploys to AWS when you push or merge PRs to the `main` branch. You can manually redeploy the webhooks by re-running the [latest GitHub Action job](https://docs.github.com/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).
