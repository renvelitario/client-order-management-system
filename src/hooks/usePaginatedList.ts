import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import { getListData } from '../utils/listResponse';

export const usePaginatedList = <T,>({
  endpoint,
  initialSort = 'desc',
  params,
}: {
  endpoint: string;
  initialSort?: 'asc' | 'desc';
  params?: Record<string, string | number | boolean | undefined | null>;
}) => {
  const [rows, setRows] = useState<T[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const fetchRows = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get(endpoint, {
        params: {
          ...(params || {}),
          page: currentPage,
          limit: pageSize,
          search: searchInput.trim() || undefined,
          sort: initialSort,
        },
      });

      const listResult = getListData<T>(data);
      setRows(listResult.data);
      setTotalRows(Number(listResult.pagination.total || 0));
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [endpoint, currentPage, pageSize, searchInput, initialSort, params]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const initialLoading = loading && !hasLoaded;

  return {
    rows,
    searchInput,
    loading,
    initialLoading,
    currentPage,
    pageSize,
    totalRows,
    totalPages,
    setCurrentPage,
    handleSearchChange,
    handlePageSizeChange,
    refetch: fetchRows,
  };
};
