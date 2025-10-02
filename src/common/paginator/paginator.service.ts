import { Injectable } from '@nestjs/common';
import { PaginateOutPut } from './types/paginate.output';

@Injectable()
export class PaginatorService {
  makePaginate<Data>(
    result: Data,
    total: number,
    amount: number,
    pageNumber: number,
  ): PaginateOutPut<Data> {
    return {
      paginationInfo: {
        pageNumber,
        totalCount: total,
        totalPagesCount: Math.ceil(total / amount),
      },
      result,
    };
  }
}
