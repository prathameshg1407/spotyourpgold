import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.APP_S3_BUCKET_NAME!;

export const uploadToS3 = async (
  buffer: Buffer,
  mimeType: string,
  folder = "sypg/owner-docs",
  publicidname = "sypgOwnerDocs"
): Promise<{ url: string; public_id: string }> => {
  const fileKey = `${folder}/${publicidname}-${Date.now()}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return {
    url: `https://${BUCKET_NAME}.s3.${process.env.APP_AWS_REGION}.amazonaws.com/${fileKey}`,
    public_id: fileKey,
  };
};

export const uploadDataUriToS3 = async (
  dataUri: string,
  folder = "sypg/owner-docs",
  publicidname = "sypgOwnerDocs"
): Promise<{ url: string; public_id: string }> => {
  // dataURI format: data:image/png;base64,iVBORw0KGgo...
  const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid Data URI");
  }
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  return uploadToS3(buffer, mimeType, folder, publicidname);
};

export const deleteFromS3 = async (fileKey: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    await s3Client.send(command);
  } catch (err) {
    console.warn(`Failed to delete image ${fileKey} from S3:`, err);
  }
};
