import { MediaTypeEnum } from 'src/common/mime-types/mediaType.enum';
import { allowedImages, allowedFiles } from './mimTypes.const';

export function detectMediaType(file?: Express.Multer.File, url?: string): MediaTypeEnum {
  if (file) {
    const mime = file.mimetype;

    if (mime.startsWith('video/')) {
      return MediaTypeEnum.VIDEO;
    }
    if (allowedImages.includes(mime)) {
      return MediaTypeEnum.IMAGE;
    }
    if (mime.startsWith('audio/')) {
      return MediaTypeEnum.AUDIO;
    }
    if (allowedFiles.includes(mime)) {
      return MediaTypeEnum.FILE;
    }
  }

  if (url) {
    if (
      url.includes('youtube.com') ||
      url.includes('vimeo.com') ||
      url.match(/\.(mp4|mov|webm)$/)
    ) {
      return MediaTypeEnum.VIDEO;
    }
    if (url.match(/\.(pdf|docx?|pptx?)$/)) {
      return MediaTypeEnum.FILE;
    }
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return MediaTypeEnum.IMAGE;
    }
  }
}
