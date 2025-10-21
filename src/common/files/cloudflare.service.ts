import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class CloudflareService {
  constructor(private readonly configService: ConfigService) {}

  private getCloudflareConfig() {
    return {
      apiToken: this.configService.get<string>('CLOUDFLARE_API_TOKEN'),
      accountId: this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID'),
    };
  }

  async uploadFileToCloudflare(file: Express.Multer.File | string) {
    const { apiToken, accountId } = this.getCloudflareConfig();

    // Handle different file input types
    let filePath: string;
    let isTemp = false;

    if (!file) {
      throw new Error('No file provided for upload');
    }

    console.log('File received for upload:', typeof file);

    if (typeof file === 'string') {
      filePath = file;
      console.log('Using provided file path:', filePath);
    } else if (file.path) {
      filePath = file.path;
      console.log('Using file path from Multer object:', filePath);
    } else if (file.buffer && file.originalname) {
      // If we have a buffer, write it to a temp file
      const tempDir = os.tmpdir();
      const fileName = `${Date.now()}-${file.originalname}`;
      filePath = path.join(tempDir, fileName);
      isTemp = true;

      try {
        fs.writeFileSync(filePath, file.buffer);
        console.log('Created temporary file at:', filePath);
      } catch (error) {
        console.error('Error creating temporary file:', error);
        throw new Error('Failed to create temporary file');
      }
    } else {
      console.error('Invalid file input:', file);
      throw new Error('Invalid file input format');
    }

    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    try {
      console.log('Uploading file to Cloudflare...');
console.log('Uploading to account:', accountId);
console.log('Using token prefix:', apiToken.slice(0, 10));

      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${apiToken}`,
          },
        },
      );

      console.log('Cloudflare response received');

      if (response.data.success) {
        console.log('Upload successful, result:', response.data.result);
        return {
          id: response.data.result.id,
          url: response.data.result.variants[0],
        };
      } else {
        console.error('❌ Cloudflare upload error:', response.data);
        throw new Error('Failed to upload image to Cloudflare');
      }
    } catch (error) {
      console.error('Error uploading image to Cloudflare:', error.message);
      throw error;
    } finally {
      // Only delete the file if we created a temporary one
      if (isTemp && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('Temporary file deleted:', filePath);
        } catch (error) {
          console.error('Failed to delete temporary file:', error);
        }
      }
    }
  }

  async deleteFileFromCloudflare(imageId: string) {
    const { apiToken, accountId } = this.getCloudflareConfig();
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiToken}`,
    };

    try {
      const response = await axios.delete(url, { headers });

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
