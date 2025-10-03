import { ConfigService } from '@nestjs/config';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
//import { MediaFolders } from '../enums/media-paths.enums';
import sharp from 'sharp';

@Injectable()
export class FilesService {
  constructor(private readonly configService: ConfigService) {}

  async saveFile(
    file,
    category: any,
    resize = false,
    width: number = null,
    height: number = null,
  ) {
    const fileDir = `./${this.configService.get<string>(
      'MEDIA_DIR',
    )}/${category}`;

    const destination = path.join(__dirname, '..', '..', '..', fileDir);

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    let fileName = Date.now() + '-' + Math.round(Math.random() * 1e9);

    const { fileTypeFromBuffer } = await (eval(
      'import("file-type")',
    ) as Promise<typeof import('file-type')>);

    const fileType = await fileTypeFromBuffer(file.buffer); //to correct the file ext and mimetype
    fileName = `${fileName}.${fileType['ext']}`;

    const filePath = path.join(destination, fileName);
    const buffer = resize
      ? await this.resizeImage(file.buffer, width, height)
      : file.buffer;

    fs.writeFileSync(filePath, buffer);

    return {
      ...file,
      fullPath: filePath,
      path: fileName,
      mimetype: fileType['mime'],
      ext: fileType['ext'],
    };
  }

  async getFilePath(media: any[], folder: any, multiple = false): Promise<any> {
    const relativePaths = media.map((media) => {
      const relative = path.relative(
        path.join(
          __dirname,
          '..',
          '..',
          '..',
          this.configService.get<string>('MEDIA_DIR'),
          folder,
        ),
        media.path,
      );

      return relative;
    });
    if (multiple) {
      return relativePaths;
    }
    console.log(relativePaths);
    return relativePaths[0];
  }

  async deleteFiles(oldUrls: string[], mediaFolder: any, withPrefix = true) {
    const filterNullUrls = oldUrls.filter((oldUrl) => oldUrl !== null);
    if (filterNullUrls.length === 0) return;
    filterNullUrls.forEach((media) => {
      let relativePath;
      if (withPrefix) {
        relativePath = media
          .replace(
            url.resolve(
              this.configService.get('APP_URL'),
              path.join(
                this.configService.get<string>('MEDIA_DIR'),
                mediaFolder,
              ),
            ),

            '',
          )
          .slice(1);
      } else {
        relativePath = media;
      }
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        this.configService.get<string>('MEDIA_DIR'),
        mediaFolder,
        relativePath,
      );
      console.log(filePath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
          return;
        } else {
          console.log(filePath, 'deleted');
          return;
        }
      });
    });
  }
  async deleteDirec(dir: string) {
    const dirPath = path.join(__dirname, '..', '..', '..', dir);

    fs.rmdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        return;
      } else {
        return;
      }
    });
  }

  async convertToWebp(file: Express.Multer.File): Promise<Buffer> {
    return sharp(file.buffer).webp().toBuffer();
  }

  // Helper method to get banner dimensions
  getBannerDimensions(type: 'web' | 'mobile'): {
    width: number;
    height: number;
  } {
    return {
      web: { width: 1920, height: 1080 },
      mobile: { width: 1080, height: 1920 },
    }[type];
  }

  private resizeImage(
    buffer: Buffer,
    width: number | null,
    height: number | null,
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize({
        width: width || undefined,
        height: height || undefined,
        fit: 'inside',
      })
      .toBuffer();
  }
}
