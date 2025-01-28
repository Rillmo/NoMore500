# NoMore500

[README in Korean (한국어)](README_KR.md) <br>
A GitHub Action that prevents 500 errors by automatically renewing expired OAuth keys monthly. This action's repository is 100% open source, and feedback is always welcome!
<br>
<br>

## Core Features
This action automatically updates the OAuth Secret Key by accessing the user's 42 Intra and updates the key on the user's server. To perform these actions, a web crawling tool is used. Additionally, SSH authentication is required to connect to a specific server and update the key. Using SSH, the action connects to the server and updates a specific key (e.g., 42SECRET) in the user-defined environment variable file (.env).
<br>
<br>

## Inputs

| Name             | Description                | Required | Example														|
|------------------|----------------------------|----------|----------------------------------------------------------------|
| `intra-id`       | 42Intra ID                 | true     | junkim2														|
| `intra-pw`       | 42Intra PW                 | true     | intrapw														|
| `app-url`        | 42OAuth App URL            | true     | https://profile.intra.42.fr/oauth/applications/12345			|
| `ssh-host`       | SSH Host                   | true     | ec2-12-345-678-90.ap-northeast-2.compute.amazonaws.com			|
| `ssh-private-key`| SSH Private Key            | true     | --BEGIN OPENSSH PRIVATE KEY--...--END OPENSSH PRIVATE KEY--	|
| `ssh-user`       | SSH User                   | true     | ec2-user														|
| `env-path`       | Path to .env file          | true     | deploy/backend/src/config/.env									|
| `env-key`        | Key to update in .env file | true     | 42_SECRET														|
| `reboot-script`  | Script to reboot server    | true     | cd ./deploy && docker-compose up -d --build					|
<br>

## Security Considerations
This action uses sensitive information such as 42 Intra ID/PW and SSH Private Key to perform tasks. Therefore, it is strongly recommended to use GitHub Secrets to securely hide important information. Below are the types of information that should generally be stored as GitHub Secrets:

- `intra-id`
- `intra-pw`
- `app-url`
- `ssh-host`
- `ssh-private-key`
- `ssh-user`
- `env-path`
- `env-key`
- `reboot-script` (optional)

If this information is not properly hidden, it may be exposed in the GitHub Action's execution logs. In the case of a public repository, sensitive information may remain in the workflow file or commits.
<br>
<br>

## Usage

To use this action, create a workflow YAML file in your `.github/workflows` directory. An example workflow is shown below:

```yaml
name: Renew OAuth Token

on:
  schedule:
    - cron: '0 0 1 * *' # Runs at 00:00 on the 1st of every month

jobs:
  renew-token:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Renew OAuth Token
        uses: Rillmo/NoMore500@v1.0.7
        with:
          intra-id: ${{ secrets.INTRA_ID }}
          intra-pw: ${{ secrets.INTRA_PW }}
          app-url: ${{ secrets.APP_URL }}
          ssh-host: ${{ secrets.SSH_HOST }}
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
          ssh-user: ${{ secrets.SSH_USER }}
          env-path: ${{ secrets.ENV_PATH }}
          env-key: ${{ secrets.ENV_KEY }}
          reboot-script: 'cd ./deploy && docker-compose up -d --build'

```

It is important to define the schedule using cron rules so that the task can be automatically triggered every month.
Also, each input under `with:` should have appropriate values.
