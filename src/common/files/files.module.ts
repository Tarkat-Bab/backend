import { Global, Module } from '@nestjs/common';
import { FilesService } from './files.services';

@Global()
@Module({
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
