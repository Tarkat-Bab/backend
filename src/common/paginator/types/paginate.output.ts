export interface PaginateOutPut<Data> {
  result: Data;
  paginationInfo: PaginationInfo;
}

export interface PaginationInfo {
  pageNumber: number;
  totalCount: number;
  totalPagesCount: number;
}
