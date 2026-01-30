// This module is server-only and uses Node.js APIs
// Using CommonJS require to avoid Turbopack bundling issues with AWS SDK
import { Readable } from "node:stream";

const {
  S3_ENDPOINT,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_PUBLIC_URL,
  S3_REGION,
  S3_FORCE_PATH_STYLE,
} = process.env;

if (!S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_BUCKET) {
  throw new Error("S3 credentials are not set");
}

const publicUrlBase = S3_PUBLIC_URL?.replace(/\/+$/, "");
const forcePathStyle =
  S3_FORCE_PATH_STYLE === "true" || (S3_ENDPOINT ? /localhost|minio/i.test(S3_ENDPOINT) : false);

// Lazy-load AWS SDK using CommonJS require to avoid Turbopack analysis
let s3Client: any = null;
async function getS3Client() {
  if (!s3Client) {
    // Use CommonJS require instead of ESM import to bypass Turbopack's module analysis
    const { S3Client } = require("@aws-sdk/client-s3");
    s3Client = new S3Client({
      region: S3_REGION || "us-east-1",
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle,
    });
  }
  return s3Client;
}

export function buildPublicUrl(key: string) {
  if (!publicUrlBase) {
    throw new Error("S3_PUBLIC_URL is not set");
  }
  return `${publicUrlBase}/${key}`;
}

export function extractKeyFromPublicUrl(url: string) {
  if (!publicUrlBase || !url.startsWith(publicUrlBase)) {
    return null;
  }
  const key = url.slice(publicUrlBase.length).replace(/^\/+/, "");
  return key.length > 0 ? key : null;
}

export async function uploadFile(params: { key: string; body: Uint8Array; contentType?: string }) {
  const s3 = await getS3Client();
  const { PutObjectCommand } = require("@aws-sdk/client-s3");
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return {
    key: params.key,
    url: buildPublicUrl(params.key),
  };
}

export async function deleteFile(key: string) {
  const s3 = await getS3Client();
  const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
  await s3.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  );
}

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function getFileBuffer(key: string) {
  const s3 = await getS3Client();
  const { GetObjectCommand } = require("@aws-sdk/client-s3");
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("File body is empty");
  }

  if (response.Body instanceof Readable) {
    return streamToBuffer(response.Body);
  }

  if (response.Body instanceof Uint8Array) {
    return Buffer.from(response.Body);
  }

  if ("transformToByteArray" in response.Body) {
    const array = await response.Body.transformToByteArray();
    return Buffer.from(array);
  }

  if ("arrayBuffer" in response.Body) {
    const arrayBuffer = await response.Body.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Unsupported file body type");
}

export async function getSignedUrl(key: string, expiresInSeconds = 3600) {
  const s3 = await getS3Client();
  const { getSignedUrl: getPresignedUrl } = require("@aws-sdk/s3-request-presigner");
  const { GetObjectCommand } = require("@aws-sdk/client-s3");
  return getPresignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
    { expiresIn: expiresInSeconds },
  );
}
