import type { PaginatedResponse } from '../types/app';

export const getListData = <T>(responseData: unknown): PaginatedResponse<T> => {
  if (Array.isArray(responseData)) {
    return {
      data: responseData as T[],
      pagination: {
        page: 1,
        limit: responseData.length,
        total: responseData.length,
        totalPages: 1,
      },
    };
  }

  const normalized = responseData as {
    data?: T[];
    pagination?: Partial<PaginatedResponse<T>['pagination']>;
  };

  return {
    data: normalized?.data || [],
    pagination: {
      page: Number(normalized?.pagination?.page ?? 1),
      limit: Number(normalized?.pagination?.limit ?? 10),
      total: Number(normalized?.pagination?.total ?? 0),
      totalPages: Number(normalized?.pagination?.totalPages ?? 1),
    },
  };
};
