import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class CloudflareService {
  constructor(private readonly configService: ConfigService) {}

  private getCloudflareConfig() {
    return {
      apiToken: this.configService.get<string>('CLOUDFLARE_API_TOKEN'),
      accountId: this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID'),
      apiUrl: 'https://api.cloudflare.com/client/v4', // ✅ fixed
    };
  }

  async uploadFileToCloudflare(file: any) {
    const { apiToken, accountId, apiUrl } = this.getCloudflareConfig();
    if (!file) throw new Error('No file provided for upload');

    let filePath: string;
    if (typeof file === 'string') {
      filePath = file;
    } else if (file.path) {
      filePath = file.path;
    } else if (file.buffer && file.originalname) {
      const tempDir = os.tmpdir();
      const fileName = `${Date.now()}-${file.originalname}`;
      filePath = path.join(tempDir, fileName);

      try {
        await fs.promises.writeFile(filePath, file.buffer);
        console.log(`Temporary file created at: ${filePath}`);
      } catch (err) {
        console.error('Error creating temporary file:', err);
        throw new Error(`Failed to create temporary file: ${err.message}`);
      }
    } else {
      throw new Error('Invalid file input: must have path or buffer');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const url = `${apiUrl}/accounts/${accountId}/images/v1`;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    try {
      console.log('Uploading file to Cloudflare:', filePath);

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          ...formData.getHeaders(),
        },
      });

      if (!response.data.success) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      console.log('✅ Cloudflare upload success:', response.data.result);

      return {
        id: response.data.result.id,
        url: response.data.result.variants[0],
      };
    } catch (error) {
      console.error(
        '❌ Cloudflare upload error:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to upload file to Cloudflare');
    } finally {
      // 🧹 Always clean up temp file if we created one
      if (file.buffer && filePath.includes(os.tmpdir())) {
        try {
          await fs.promises.unlink(filePath);
          console.log(`Temporary file deleted: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete temporary file: ${filePath}`, err);
        }
      }
    }
  }

  async deleteFileFromCloudflare(imageId: string) {
    const { apiToken, accountId, apiUrl } = this.getCloudflareConfig();
    const url = `${apiUrl}/accounts/${accountId}/images/v1/${imageId}`;

    try {
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      if (response.data.success) {
        console.log(`🗑️ Deleted Cloudflare image: ${imageId}`);
        return { success: true };
      } else {
        throw new Error(JSON.stringify(response.data.errors));
      }
    } catch (error) {
      console.error('❌ Cloudflare delete error:', error.response?.data || error);
      throw new Error('Failed to delete file from Cloudflare');
    }
  }
}
