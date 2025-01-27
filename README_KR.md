# NoMore500

매월 수동으로 42 OAuth Secret Key를 업데이트해야 하는 문제를 해결하고, 매월 발생하는 500 에러를 막기 위한 Github Action입니다. 이 액션의 저장소는 100% 오픈소스이며, 피드백은 언제나 환영입니다!
<br>
<br>

## 핵심 기능
이 액션은 사용자의 42 Intra에 접속해 OAuth Secret Key를 자동으로 업데이트하고, 사용자의 서버에 해당 키를 업데이트하는 일을 자동으로 수행합니다.
이러한 동작을 수행하기 위해 웹 크롤링 툴을 사용하게 됩니다.
또한 특정 서버에 접속해 키를 업데이트하기 위해 ssh 인증을 필수로 요구합니다.
ssh를 사용해 서버에 접속하고, 사용자가 정의한 환경변수 파일(.env)의 특정 키(ex. 42SECRET)를 업데이트하는 동작이 수행됩니다.
<br>
<br>

## 입력값

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

## 보안적으로 고려해야 할 사항

이 액션은 사용자로부터 42 Intra ID/PW, SSH Private Key 등과 같은 민감한 정보를 사용해 작업을 수행합니다. 따라서 Github Secret을 사용해 보안적으로 중요한 정보들을 적절히 숨기는 것을 강력히 권장합니다.
아래는 일반적으로 Github Secret을 사용해야 하는 정보들입니다:

- `intra-id`
- `intra-pw`
- `app-url`
- `ssh-host`
- `ssh-private-key`
- `ssh-user`
- `env-path`
- `env-key`
- `reboot-script` (optional)

만약 해당 정보들을 적절히 숨기지 않은 경우, Github Action의 실행 로그에 해당 정보들이 노출될 수 있고, Public 리포지토리의 경우 워크플로우 파일 또는 커밋 내에 민감한 정보들이 남을 수 있습니다.
<br>
<br>

## 사용법

이 액션을 사용하려면, 먼저 `.github/workflows` 디렉토리 내에 워크플로우 YAML 파일을 생성해야 합니다. 예시는 아래와 같습니다:

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
        uses: Rillmo/NoMore500@v1.0.0
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

cron 규칙으로 스케줄을 정의하고, 이를 통해 매월 자동으로 작업이 트리거될 수 있도록 하는 것이 중요합니다.
또한 `with:`아래에 각 입력이 적절한 값이어야 합니다.