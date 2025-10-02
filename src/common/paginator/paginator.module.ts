import { Global, Module } from '@nestjs/common';
import { PaginatorService } from './paginator.service';

@Global()
@Module({
  providers: [PaginatorService],
  exports: [PaginatorService],
})
export class PaginatorModule {}
