import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SUCCESS_MESSAGE = 'Record deleted successfully.';
const DEFAULT_ERROR_MESSAGE = 'Failed to delete record.';

export const useDeleteDialog = (getErrorMessage) => {
  const [deleteDialog, setDeleteDialog] = useState({ show: false, id: null });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const notificationTimeoutRef = useRef(null);

  const clearNotificationTimer = useCallback(() => {
    window.clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = null;
  }, []);

  useEffect(() => () => clearNotificationTimer(), [clearNotificationTimer]);

  const showNotification = useCallback((message, type) => {
    clearNotificationTimer();
    setNotification({ message, type });
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification({ message: '', type: '' });
      notificationTimeoutRef.current = null;
    }, 4000);
  }, [clearNotificationTimer]);

  const handleDeleteClick = useCallback((id) => {
    setDeleteDialog({ show: true, id });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ show: false, id: null });
  }, []);

  const handleDeleteConfirm = useCallback(async (
    deleteAction,
    onSuccess,
    messages = {},
  ) => {
    const id = deleteDialog.id;
    setDeleteDialog({ show: false, id: null });

    if (id === null || id === undefined) {
      return;
    }

    try {
      await deleteAction(id);
      if (typeof onSuccess === 'function') {
        onSuccess(id);
      }
      showNotification(messages.success || DEFAULT_SUCCESS_MESSAGE, 'success');
    } catch (error) {
      const resolvedMessage = typeof getErrorMessage === 'function'
        ? getErrorMessage(error)
        : error?.response?.data?.error || messages.error || DEFAULT_ERROR_MESSAGE;
      showNotification(resolvedMessage || messages.error || DEFAULT_ERROR_MESSAGE, 'error');
    }
  }, [deleteDialog.id, getErrorMessage, showNotification]);

  return {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    showNotification,
  };
};
