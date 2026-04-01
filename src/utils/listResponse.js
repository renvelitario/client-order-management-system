export const getListData = (responseData) => {
  if (Array.isArray(responseData)) {
    return {
      data: responseData,
      pagination: {
        page: 1,
        limit: responseData.length,
        total: responseData.length,
        totalPages: 1,
      },
    };
  }

  return {
    data: responseData?.data || [],
    pagination: responseData?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
};
