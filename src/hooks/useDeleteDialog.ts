import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError, NotificationState } from '../types/app';
import { resolveApiErrorMessage } from '../types/app';

const DEFAULT_SUCCESS_MESSAGE = 'Record deleted successfully.';
const DEFAULT_ERROR_MESSAGE = 'Failed to delete record.';

type DeleteDialogState<TId> = { show: boolean; id: TId | null };

export const useDeleteDialog = <TId extends string | number>(
  getErrorMessage?: (error: ApiError) => string,
) => {
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState<TId>>({ show: false, id: null });
  const [notification, setNotification] = useState<NotificationState>({ message: '', type: '' });
  const notificationTimeoutRef = useRef<number | null>(null);

  const clearNotificationTimer = useCallback(() => {
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearNotificationTimer(), [clearNotificationTimer]);

  const showNotification = useCallback((message: string, type: NotificationState['type']) => {
    clearNotificationTimer();
    setNotification({ message, type });
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification({ message: '', type: '' });
      notificationTimeoutRef.current = null;
    }, 4000);
  }, [clearNotificationTimer]);

  const handleDeleteClick = useCallback((id: TId) => {
    setDeleteDialog({ show: true, id });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ show: false, id: null });
  }, []);

  const handleDeleteConfirm = useCallback(async (
    deleteAction: (id: TId) => Promise<unknown>,
    onSuccess?: (id: TId) => void,
    messages: { success?: string; error?: string } = {},
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
        ? getErrorMessage(error as ApiError)
        : resolveApiErrorMessage(error, messages.error || DEFAULT_ERROR_MESSAGE);
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
