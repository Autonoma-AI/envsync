import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import fs from 'node:fs';
import path from 'node:path';

export interface EnvsyncConfig {
    secretName: string;
    envFile: string;
    region?: string;
}

interface FetchResult {
    value: string;
    version: string;
}

async function fetchSecret(secretName: string, region?: string): Promise<FetchResult> {
    const client = new SecretsManagerClient(region ? { region } : {});
    try {
        const response = await client.send(
            new GetSecretValueCommand({ SecretId: secretName })
        );
        const value = response.SecretString
            ?? (response.SecretBinary ? Buffer.from(response.SecretBinary).toString('utf8') : '');
        if (!response.VersionId) {
            throw new Error(`Secret ${secretName} returned no VersionId`);
        }
        return {
            value,
            version: response.VersionId,
        };
    } catch (error) {
        console.error(`Error fetching secret ${secretName}:`, error);
        throw error;
    }
}

export async function saveSecretToEnv(): Promise<void> {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
        console.warn('envsync should not be used in a browser or Edge environment.');
        return;
    }

    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.error('package.json not found in project root.');
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        envsync?: EnvsyncConfig;
    };
    const config = packageJson.envsync;

    if (!config || !config.secretName || !config.envFile) {
        console.error('Missing configuration in package.json. Expected "envsync": { "secretName": "your-secret-name", "envFile": ".env", "region": "us-east-1" (optional) }');
        return;
    }

    const envFilePath = path.resolve(process.cwd(), config.envFile);
    if (fs.existsSync(envFilePath)) {
        const currentEnvContent = fs.readFileSync(envFilePath, 'utf8');
        const match = currentEnvContent.match(/^SECRET_VERSION=(.+)$/m);
        const currentVersion = match ? match[1] : null;

        const { value, version } = await fetchSecret(config.secretName, config.region);
        if (currentVersion === version) {
            console.log(`Secret is already up-to-date (version ${version}). Skipping download.`);
            return;
        }

        fs.writeFileSync(envFilePath, `SECRET_VERSION=${version}\n${value}`);
        console.log(`Secret updated to version ${version} and written to ${config.envFile}`);
    } else {
        const { value, version } = await fetchSecret(config.secretName, config.region);
        fs.writeFileSync(envFilePath, `SECRET_VERSION=${version}\n${value}`);
        console.log(`Secret written to ${config.envFile} with version ${version}`);
    }
}
