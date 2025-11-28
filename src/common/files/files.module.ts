import { Global, Module } from '@nestjs/common';
import { FilesService } from './files.services';
import { CloudflareService } from './cloudflare.service';

@Global()
@Module({
  providers: [FilesService, CloudflareService],
  exports: [FilesService, CloudflareService],
})
export class FilesModule {}
