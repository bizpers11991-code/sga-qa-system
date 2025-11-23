import { S3Client } from '@aws-sdk/client-s3';

export interface R2Config {
    client: S3Client;
    bucketName: string;
    publicUrl: string;
}

let r2Config: R2Config | null = null;

export const getR2Config = (): R2Config => {
    if (r2Config) {
        return r2Config;
    }

    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
        throw new Error('DATABASE_CONFIGURATION_ERROR: Cloudflare R2 environment variables are not fully set.');
    }

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });

    // Ensure the public URL doesn't have a trailing slash, which can cause issues
    const publicUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;

    r2Config = { client, bucketName: R2_BUCKET_NAME, publicUrl };
    return r2Config;
};