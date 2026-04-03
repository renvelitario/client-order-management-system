import api from "../../utils/api";
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useState } from 'react';
import "../../styles/shared/entity-list.css";
import { formatPeso } from "../../utils/formatters";
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import ProductFormModal from '../../components/ui/ProductFormModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import { resolveEntityMutationErrorMessage } from '../../types/app';
import type { ApiError, Product } from '../../types/app';

type ProductFormData = {
  sku: string;
  product_name: string;
  price: string;
  status: string;
};

const emptyProductForm: ProductFormData = {
  sku: '',
  product_name: '',
  price: '',
  status: 'active',
};

const ProductsList = () => {
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [activeSku, setActiveSku] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageNotification, setPageNotification] = useState({ message: '', type: 'success' });
  const {
    rows: products,
    searchInput,
    loading,
    currentPage,
    pageSize,
    totalRows,
    totalPages,
    setCurrentPage,
    handleSearchChange,
    handlePageSizeChange,
    refetch,
  } = usePaginatedList<Product>({ endpoint: '/products', initialSort: 'desc' });
  const {
    deleteDialog,
    notification,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm: confirmDelete,
  } = useDeleteDialog<string>((err: ApiError) => {
    if (err.response?.status === 409) {
      return 'This record cannot be deleted because it is used in other records.';
    }
    return err.response?.data?.error || 'Failed to delete record.';
  });

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/products/${id}`),
      () => refetch(),
    );
  };

  const resetProductModalState = useCallback(() => {
    setIsModalOpen(false);
    setModalError('');
    setActiveSku(null);
    setFormData(emptyProductForm);
  }, []);

  const closeProductModal = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetProductModalState();
  }, [isSubmitting, resetProductModalState]);

  const openCreateModal = () => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('create');
    setActiveSku(null);
    setFormData(emptyProductForm);
    setModalError('');
    setIsModalOpen(true);
  };

  const openUpdateModal = (product: Product) => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('update');
    setActiveSku(product.sku);
    setFormData({
      sku: product.sku || '',
      product_name: product.product_name || '',
      price: String(product.price ?? ''),
      status: product.status || 'active',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        await api.post('/products', formData);
        setPageNotification({ message: 'Product created successfully.', type: 'success' });
      } else {
        if (!activeSku) {
          throw new Error('Missing product SKU for update.');
        }

        await api.put(`/products/${activeSku}`, formData);
        setPageNotification({ message: 'Product updated successfully.', type: 'success' });
      }

      await refetch();
      resetProductModalState();
    } catch (err) {
      setModalError(resolveEntityMutationErrorMessage(err, modalMode, 'product'));
      setPageNotification({ message: '', type: 'success' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const productModal = (
    <ProductFormModal
      open={isAdmin && isModalOpen}
      mode={modalMode}
      formData={formData}
      error={modalError}
      isSubmitting={isSubmitting}
      onChange={handleFormChange}
      onSubmit={handleModalSubmit}
      onRequestClose={closeProductModal}
    />
  );

  if (loading) return <PageLoader />;

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Product"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <ListPageHeader
        title="Products"
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
      {productModal}

      <table id="products-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product Name</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((p) => (
              <tr
                key={p.sku}
                className={p.status === "inactive" ? "inactive-row" : ""}
              >
                <td>{p.sku}</td>
                <td>{p.product_name}</td>
                <td>{formatPeso(p.price)}</td>
                <td>{p.status}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => openUpdateModal(p)}
                  >
                    <span className="material-icons">edit</span>
                    <span className="edit-text">Edit</span>
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(p.sku)}
                  >
                    <span className="material-icons">delete</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
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

export default ProductsList;
