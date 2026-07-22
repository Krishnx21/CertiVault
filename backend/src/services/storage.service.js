import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "../config/env.js";

const getClient = () => {
  const { awsRegion, awsAccessKeyId, awsSecretAccessKey } = getEnv();
  return new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });
};

export const uploadToS3 = async ({ key, buffer, mimeType }) => {
  const { awsBucket } = getEnv();
  await getClient().send(
    new PutObjectCommand({
      Bucket: awsBucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
    })
  );
  return { bucket: awsBucket, key };
};

export const deleteFromS3 = async (key) => {
  const { awsBucket } = getEnv();
  await getClient().send(new DeleteObjectCommand({ Bucket: awsBucket, Key: key }));
};

export const getPresignedUrl = async (key) => {
  const { awsBucket, presignedUrlExpiry } = getEnv();
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: awsBucket, Key: key }), {
    expiresIn: presignedUrlExpiry,
  });
};
