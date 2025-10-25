import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class CloudflareService {
  private s3: S3Client;
  private bucketName: string;
  private accountId: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('CLOUDFLARE_BUCKET_NAME');
    this.accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`, // ✅ no bucket here
      credentials: {
        accessKeyId: this.configService.get<string>('CLOUDFLARE_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('CLOUDFLARE_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) throw new Error('No file provided');

    const fileKey = `uploads/${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get('CLOUDFLARE_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('CLOUDFLARE_SECRET_ACCESS_KEY'),
      },
    });

    await this.s3.send(new PutObjectCommand(params));
    const publicUrl = `https://${process.env.APP_URL}/${fileKey}`;
    return { url: publicUrl };
  }
}
