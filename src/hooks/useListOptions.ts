import { useEffect, useState } from 'react';
import api from '../utils/api';
import { devError } from '../utils/devLogger';
import { getListData } from '../utils/listResponse';

type UseListOptionsParams<T> = {
  endpoint: string;
  filter?: (row: T) => boolean;
};

export const useListOptions = <T,>({ endpoint, filter }: UseListOptionsParams<T>) => {
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    let cancelled = false;

    api.get(endpoint, { params: { page: 1, limit: 100, sort: 'desc' } })
      .then((res) => {
        if (cancelled) {
          return;
        }

        const allRows = getListData<T>(res.data).data;
        setRows(typeof filter === 'function' ? allRows.filter(filter) : allRows);
      })
      .catch((error) => {
        devError('[USE_LIST_OPTIONS] Failed to load list options.', error);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, filter]);

  return rows;
};
