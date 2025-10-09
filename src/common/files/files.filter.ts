import { BadRequestException } from '@nestjs/common';
import { allowedFiles, allowedImages } from '../mime-types/mimTypes.const';

export const imageFilter = (req, file, cb) => {
  if (!allowedImages.includes(file?.mimetype))
    return cb(new BadRequestException('Not allowed file type'), false);

  cb(null, true);
};
export const filesFilter = (req, file, cb) => {
  if (!allowedFiles.includes(file?.mimetype))
    return cb(new BadRequestException('Not allowed file type'), false);

  cb(null, true);
};
