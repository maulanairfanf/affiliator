export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface WithPagination {
  page?: number;
  pageSize?: number;
}
