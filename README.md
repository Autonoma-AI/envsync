# envsync

envsync is a Node.js package that fetches secrets from AWS Secrets Manager and stores them in an environment file. This helps in keeping secrets secure while ensuring they are available for your application during development. ⚡

## ✨ Features

- 🔐 Automatically downloads and updates secrets from AWS Secrets Manager
- 📄 Stores secrets in an `.env` file for easy access
- 🚀 Prevents unnecessary downloads by checking the secret version
- ⚙️ Configuration stored in `package.json`
- 🔑 Uses the default AWS credential chain on the user's system (env vars, `~/.aws/credentials`, SSO, IAM roles)
- 🛠️ Designed for **development environments only**

## 📥 Installation

Install envsync as a **dev dependency**:

```sh
npm install @autonoma-ai/envsync --save-dev
```

## ⚙️ Configuration

Add the following configuration in your `package.json` file:

```json
"envsync": {
  "secretName": "your-secret-name",
  "envFile": ".env",
  "region": "us-east-1"
}
```

- **secretName**: The name (or ARN) of the secret in AWS Secrets Manager
- **envFile**: The target file where the secret will be stored
- **region** *(optional)*: AWS region. If omitted, the SDK uses `AWS_REGION` / `AWS_DEFAULT_REGION` or your configured profile's region.

### 🔐 Credentials

envsync uses the standard AWS SDK credential provider chain, so it picks up whatever your system already has configured. In order, it will look at:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
2. Shared credentials file (`~/.aws/credentials`) — honors `AWS_PROFILE`
3. SSO / IAM Identity Center
4. ECS / EC2 instance metadata

No credential configuration is required from the package itself.

### 🗂️ Secret format

The secret payload is written to `envFile` verbatim, so store it in AWS Secrets Manager as the raw contents of a `.env` file, e.g.:

```
DATABASE_URL=postgres://...
API_KEY=sk-...
```

## 🚀 Usage

You can use envsync programmatically within your Node.js application:

```javascript
import { saveSecretToEnv } from '@autonoma-ai/envsync';

await saveSecretToEnv();
```

Alternatively, add a script in `package.json` to run it easily:

```json
"scripts": {
  "fetch-secret": "node -e \"import('@autonoma-ai/envsync').then(({ saveSecretToEnv }) => saveSecretToEnv())\""
}
```

Run the script with:

```sh
npm run fetch-secret
```

## 🔄 How It Works

1. 📝 envsync reads the configuration from `package.json`.
2. 🔑 It fetches the latest version of the secret from AWS Secrets Manager (using `AWSCURRENT`).
3. 🛑 If the secret `VersionId` matches the one tracked in the `.env` file, it skips the update.
4. ✅ If the version is different, it updates the `.env` file with the new secret and records the new `VersionId`.

## ⚠️ Important

**envsync is designed for development environments only!** 🚧 Do not use it in production to prevent security risks.

## 🔧 Requirements

- 📌 Node.js 14+
- ☁️ AWS credentials configured on the system with `secretsmanager:GetSecretValue` permission for the target secret

## 📜 License

MIT
