import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
}

export class S3Service {
  private bucket = process.env.AWS_BUCKET_NAME!;

  /**
   * Generate a presigned PUT URL for direct client upload to S3
   */
  async generatePresignedUrl(
    filename: string,
    contentType: string,
    folder: string = "properties" // e.g. properties/123/images
  ): Promise<PresignedUrlResponse> {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    } as PutObjectCommandInput);

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5,
    });

    const publicUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { presignedUrl, key, publicUrl };
  }
}

export const s3Service = new S3Service();
