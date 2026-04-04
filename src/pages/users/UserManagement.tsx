import api from '../../utils/api';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import '../../styles/shared/table-ui-layout-controls.css';
import '../../styles/shared/table-ui-core.css';
import '../../styles/shared/table-ui-actions.css';
import '../../styles/shared/feedback-ui-notification.css';
import '../../styles/shared/modal-ui-base.css';
import '../../styles/shared/form-ui-entity-modal.css';
import '../../styles/shared/table-ui-pagination.css';
import '../../styles/shared/table-ui-responsive.css';
import '../../styles/pages/users/user-management.css';
import Pagination from '../../components/ui/Pagination';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import UserFormModal from '../../components/ui/UserFormModal';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import DataTable, { DataTableActions, DataTableEmptyState } from '../../components/ui/DataTable';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import { resolveApiErrorMessage } from '../../types/app';
import type { NotificationState, UserSummary } from '../../types/app';

type UserFilter = 'all' | 'Admin' | 'User';

type UserModalMode = 'create' | 'update';

type UserFormData = {
  email: string;
  username: string;
    name: string;
  password: string;
  confirm_password: string;
  acc_type: 'Admin' | 'User';
  status: 'Active' | 'Disabled';
};

const emptyUserForm: UserFormData = {
  email: '',
  username: '',
    name: '',
  password: '',
  confirm_password: '',
  acc_type: 'User',
  status: 'Active',
};

const roleLabel = (value: string) => (value === 'User' ? 'Delivery User' : 'Admin');
const toRoleBadgeClass = (value: string) => `users-role-pill ${value === 'Admin' ? 'users-role-pill--admin' : 'users-role-pill--delivery'}`;
const toStatusBadgeClass = (value: string) => `delivery-status-pill ${String(value).toLowerCase() === 'active' ? 'status-delivered' : 'status-failed'}`;

const UserManagement = () => {
  const { localUser } = useAuth();
  const [filter, setFilter] = useState<UserFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserModalMode>('create');
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [editingAdminTarget, setEditingAdminTarget] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(emptyUserForm);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageNotification, setPageNotification] = useState<NotificationState>({ message: '', type: '' });
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<Record<string, string> | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const listParams = useMemo(
    () => ({ acc_type: filter === 'all' ? undefined : filter }),
    [filter],
  );

  const {
    rows: users,
    searchInput,
    initialLoading,
    currentPage,
    pageSize,
    totalRows,
    totalPages,
    setCurrentPage,
    handleSearchChange,
    handlePageSizeChange,
    refetch,
  } = usePaginatedList<UserSummary>({ endpoint: '/users', initialSort: 'asc', params: listParams });

  const resetModalState = useCallback(() => {
    setIsModalOpen(false);
    setModalMode('create');
    setActiveUserId(null);
    setEditingAdminTarget(false);
    setModalError('');
    setFormData(emptyUserForm);
    setPendingUpdatePayload(null);
    setIsConfirmModalOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetModalState();
  }, [isSubmitting, resetModalState]);

  const openCreateModal = () => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('create');
    setActiveUserId(null);
    setEditingAdminTarget(false);
    setModalError('');
    setFormData(emptyUserForm);
    setIsModalOpen(true);
  };

  const openUpdateModal = (user: UserSummary) => {
    const isOtherAdmin = user.acc_type === 'Admin' && Number(user.user_id) !== Number(localUser?.user_id);
    if (isOtherAdmin) {
      setPageNotification({ message: 'Co-admin accounts cannot be edited here.', type: 'error' });
      return;
    }

    setPageNotification({ message: '', type: 'success' });
    setModalMode('update');
    setActiveUserId(user.user_id);
    setEditingAdminTarget(user.acc_type === 'Admin');
    setModalError('');
    setFormData({
      email: user.email || '',
      username: user.username,
      name: user.name || '',
      password: '',
      confirm_password: '',
      acc_type: (user.acc_type === 'Admin' ? 'Admin' : 'User'),
      status: user.status === 'Active' ? 'Active' : 'Disabled',
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    if (modalError) {
      setModalError('');
    }
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError('');

    try {
      if (modalMode === 'create') {
        setIsSubmitting(true);

        if (formData.password !== formData.confirm_password) {
          setModalError('Passwords do not match.');
          return;
        }

        await api.post('/auth/register', {
          email: formData.email.trim(),
          username: formData.username.trim(),
                    name: formData.name.trim(),
          password: formData.password,
          confirm_password: formData.confirm_password,
          acc_type: formData.acc_type,
          status: formData.status,
        });

        setPageNotification({ message: 'User registered successfully.', type: 'success' });
      } else {
        if (!activeUserId) {
          throw new Error('Missing user ID for update.');
        }

        if (editingAdminTarget) {
          setModalError('Co-admin accounts cannot be edited here.');
          return;
        }

        if (formData.password || formData.confirm_password) {
          if (formData.password !== formData.confirm_password) {
            setModalError('New password and confirm password do not match.');
            return;
          }

          const passwordPolicyRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
          if (!passwordPolicyRegex.test(formData.password)) {
            setModalError('Password must be at least 8 characters and include letters and numbers.');
            return;
          }
        }

        const payload: Record<string, string> = {
                    name: formData.name.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          acc_type: formData.acc_type,
          status: formData.status,
        };

        if (formData.password) {
          payload.new_password = formData.password;
          payload.confirm_password = formData.confirm_password;
        }

        setPendingUpdatePayload(payload);
        setIsConfirmModalOpen(true);
        return;
      }

      await refetch();
      resetModalState();
    } catch (error) {
      setModalError(resolveApiErrorMessage(error, modalMode === 'create' ? 'Failed to register user.' : 'Failed to update user.'));
      setPageNotification({ message: '', type: 'success' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!activeUserId || !pendingUpdatePayload) {
      setIsConfirmModalOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/auth/users/${activeUserId}`, pendingUpdatePayload);

      setPageNotification({ message: 'User updated successfully.', type: 'success' });

      await refetch();
      resetModalState();
    } catch (error) {
      setModalError(resolveApiErrorMessage(error, 'Failed to update user.'));
      setPageNotification({ message: '', type: 'success' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const usersHeaderAction = (
    <button type="button" className="create-button" onClick={openCreateModal}>
      <span className="material-icons">person_add</span>
      Create / Sign Up User
    </button>
  );

  const usersFilterBar = (
    <div className="users-filter-row">
      <label className="users-filter-control" htmlFor="users-role-filter">
        <span>Filter</span>
        <select
          id="users-role-filter"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value as UserFilter);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Users</option>
          <option value="Admin">Admin</option>
          <option value="User">Delivery Users</option>
        </select>
      </label>
    </div>
  );

  if (initialLoading) return <PageLoader />;

  return (
    <div className="container users-management-container">
      <DeleteConfirmModal
        open={isConfirmModalOpen}
        title="Confirm User Update"
        message="Apply these changes to this user account?"
        onCancel={() => {
          if (isSubmitting) {
            return;
          }

          setIsConfirmModalOpen(false);
          setPendingUpdatePayload(null);
        }}
        onConfirm={() => void handleConfirmUpdate()}
        cancelLabel="Cancel"
        confirmLabel="Yes, save changes"
      />

      <ListPageHeader
        title="User Management"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        action={usersHeaderAction}
      />

      {usersFilterBar}

      <Notification message={pageNotification.message} type={pageNotification.type} />

      <UserFormModal
        open={isModalOpen}
        mode={modalMode}
        formData={formData}
        error={modalError}
        isSubmitting={isSubmitting}
        onChange={handleFormChange}
        onSubmit={handleModalSubmit}
        onRequestClose={closeModal}
      />

      <DataTable id="users-table">
        <thead>
          <tr>
            <th className="table-col-number">ID</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th className="table-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.user_id}>
                <td className="table-col-number">{user.user_id}</td>
                <td>{user.username}</td>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email || 'N/A'}</td>
                <td>
                  <span className={toRoleBadgeClass(user.acc_type)}>{roleLabel(user.acc_type)}</span>
                </td>
                <td>
                  <span className={toStatusBadgeClass(user.status)}>{user.status}</span>
                </td>
                <td className="table-col-actions">
                  <DataTableActions>
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => openUpdateModal(user)}
                      disabled={user.acc_type === 'Admin' && Number(user.user_id) !== Number(localUser?.user_id)}
                      title={user.acc_type === 'Admin' && Number(user.user_id) !== Number(localUser?.user_id) ? 'Co-admin accounts cannot be edited here.' : 'Edit user'}
                    >
                      <span className="material-icons">edit</span>
                      <span className="edit-text">Edit</span>
                    </button>
                  </DataTableActions>
                </td>
              </tr>
            ))
          ) : (
            <DataTableEmptyState colSpan={7} message="No users found." />
          )}
        </tbody>
      </DataTable>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalRows={totalRows}
      />
    </div>
  );
};

export default UserManagement;



