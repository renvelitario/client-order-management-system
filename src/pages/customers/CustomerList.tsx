import api from "../../utils/api";
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useState } from 'react';
import '../../styles/shared/table-ui-layout-controls.css';
import '../../styles/shared/table-ui-core.css';
import '../../styles/shared/table-ui-actions.css';
import '../../styles/shared/feedback-ui-notification.css';
import '../../styles/shared/modal-ui-base.css';
import '../../styles/shared/form-ui-entity-modal.css';
import '../../styles/shared/table-ui-pagination.css';
import '../../styles/shared/table-ui-responsive.css';
import '../../styles/pages/customers/customer-list.css';
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import CustomerFormModal from '../../components/ui/CustomerFormModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DataTable, { DataTableActions, DataTableEmptyState } from '../../components/ui/DataTable';
import { resolveEntityMutationErrorMessage } from '../../types/app';
import type { ApiError, Customer } from '../../types/app';

type CustomerFormData = {
  name: string;
  address: string;
  contact_no: string;
};

const emptyCustomerForm: CustomerFormData = {
  name: '',
  address: '',
  contact_no: '',
};

const CustomersList = () => {
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyCustomerForm);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageNotification, setPageNotification] = useState({ message: '', type: 'success' });
  const {
    rows: customers,
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
    refetch,
  } = usePaginatedList<Customer>({ endpoint: '/customers', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog<number>((err: ApiError) => {
    if (err.response?.status === 409) {
      return 'This record cannot be deleted because it is used in other records.';
    }
    return err.response?.data?.error || 'Failed to delete record.';
  });

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/customers/${id}`),
      () => refetch(),
    );
  };

  const resetCustomerModalState = useCallback(() => {
    setIsModalOpen(false);
    setModalError('');
    setActiveCustomerId(null);
    setFormData(emptyCustomerForm);
  }, []);

  const closeCustomerModal = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    resetCustomerModalState();
  }, [isSubmitting, resetCustomerModalState]);

  const openCreateModal = () => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('create');
    setActiveCustomerId(null);
    setFormData(emptyCustomerForm);
    setModalError('');
    setIsModalOpen(true);
  };

  const openUpdateModal = (customer: Customer) => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('update');
    setActiveCustomerId(customer.customer_id);
    setFormData({
      name: customer.name,
      address: customer.address,
      contact_no: customer.contact_no,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        await api.post('/customers', formData);
        setPageNotification({ message: 'Customer created successfully.', type: 'success' });
      } else {
        if (!activeCustomerId) {
          throw new Error('Missing customer id for update.');
        }
        await api.put(`/customers/${activeCustomerId}`, formData);
        setPageNotification({ message: 'Customer updated successfully.', type: 'success' });
      }

      await refetch();
      resetCustomerModalState();
    } catch (err) {
      setModalError(resolveEntityMutationErrorMessage(err, modalMode, 'customer'));
      setPageNotification({ message: '', type: 'success' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerModal = (
    <CustomerFormModal
      open={isAdmin && isModalOpen}
      mode={modalMode}
      formData={formData}
      error={modalError}
      isSubmitting={isSubmitting}
      onChange={handleFormChange}
      onSubmit={handleModalSubmit}
      onRequestClose={closeCustomerModal}
    />
  );

  if (initialLoading) return <PageLoader />;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Customer"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <ListPageHeader
        title="Customers"
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        action={isAdmin && (
          <button type="button" className="create-button" onClick={openCreateModal}>
            <span className="material-icons">add</span>
            Create
          </button>
        )}
      />

      <Notification message={pageNotification.message} type={pageNotification.type} />
      <Notification message={notification.message} type={notification.type} />
      {customerModal}

      <DataTable id="customers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Contact No</th>
            <th className="table-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((c) => (
              <tr key={c.customer_id}>
                <td>
                  <span className="delivery-order-id-chip">#{c.customer_id}</span>
                </td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.contact_no}</td>
                <td className="table-col-actions">
                  <DataTableActions>
                    <button
                      className="edit-button"
                      onClick={() => openUpdateModal(c)}
                    >
                      <span className="material-icons">edit</span>
                      <span className="edit-text">Edit</span>
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(c.customer_id)}
                    >
                      <span className="material-icons">delete</span>
                      <span className="delete-text">Delete</span>
                    </button>
                  </DataTableActions>
                </td>
              </tr>
            ))
          ) : (
            <DataTableEmptyState colSpan={5} message="No customers found." />
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

export default CustomersList;



