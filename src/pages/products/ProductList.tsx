import api from "../../utils/api";
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/shared/table-page.css';
import '../../styles/pages/products/product-list.css';
import { formatPeso } from "../../utils/formatters";
import { useDeleteDialog } from '../../hooks/useDeleteDialog';
import Pagination from '../../components/ui/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { useAuth } from '../../hooks/useAuth';
import BarcodeScanner from '../../components/features/BarcodeScanner';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import ProductFormModal from '../../components/ui/ProductFormModal';
import ListPageHeader from '../../components/ui/ListPageHeader';
import Notification from '../../components/ui/Notification';
import PageLoader from '../../components/ui/PageLoader';
import DataTable, { DataTableActions, DataTableEmptyState } from '../../components/ui/DataTable';
import FilterDropdown from '../../components/ui/FilterDropdown';
import AppIcon from '../../components/ui/AppIcon';
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

type ProductStatusFilter = 'all' | 'active' | 'inactive';

const PRODUCT_STATUS_OPTIONS: Array<{ value: ProductStatusFilter; label: string }> = [
  { value: 'all', label: 'Show All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const normalizeProductStatus = (value: string | null | undefined): ProductStatusFilter | 'all' => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'inactive') {
    return normalized;
  }

  return 'all';
};

const ProductsList = () => {
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const [pageNotification, setPageNotification] = useState({ message: '', type: 'success' });
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all');
  const searchScanButtonRef = useRef<HTMLButtonElement | null>(null);
  const listParams = useMemo(() => ({
    status: statusFilter === 'all' ? undefined : statusFilter,
  }), [statusFilter]);
  const {
    rows: products,
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
  } = usePaginatedList<Product>({ endpoint: '/products', initialSort: 'asc', params: listParams });
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

  useEffect(() => {
    if (!isSearchScannerOpen && searchScanButtonRef.current) {
      searchScanButtonRef.current.focus();
    }
  }, [isSearchScannerOpen]);

  const handleDeleteConfirm = async () => {
    await confirmDelete(
      (id) => api.delete(`/products/${id}`),
      () => refetch(),
    );
  };

  const resetProductModalState = useCallback(() => {
    setIsModalOpen(false);
    setModalError('');
    setActiveProductId(null);
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
    setActiveProductId(null);
    setFormData(emptyProductForm);
    setModalError('');
    setIsModalOpen(true);
  };

  const openUpdateModal = (product: Product) => {
    setPageNotification({ message: '', type: 'success' });
    setModalMode('update');
    setActiveProductId(product.product_id);
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

  const handleSkuDetected = (sku: string) => {
    setFormData((previous) => ({
      ...previous,
      sku,
    }));

    if (modalError) {
      setModalError('');
    }
  };

  const handleSearchSkuDetected = (sku: string) => {
    handleSearchChange(sku);
    setIsSearchScannerOpen(false);
  };

  const handleStatusFilterChange = (nextFilter: ProductStatusFilter) => {
    setStatusFilter(nextFilter);
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    if (statusFilter === 'all') {
      return products;
    }

    return products.filter((product) => normalizeProductStatus(product.status) === statusFilter);
  }, [products, statusFilter]);

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        await api.post('/products', formData);
        setPageNotification({ message: 'Product created successfully.', type: 'success' });
      } else {
        if (!activeProductId) {
          throw new Error('Missing product ID for update.');
        }

        await api.put(`/products/${activeProductId}`, formData);
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
      onScanSku={handleSkuDetected}
      onChange={handleFormChange}
      onSubmit={handleModalSubmit}
      onRequestClose={closeProductModal}
    />
  );

  return (
    <div className="container">
      <DeleteConfirmModal
        open={deleteDialog.show}
        title="Delete Product"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <BarcodeScanner
        isOpen={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onDetected={handleSearchSkuDetected}
      />

      <ListPageHeader
        kicker="Operations"
        title="Products"
        subtitle="Manage catalog records, pricing, and availability status."
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        searchAriaLabel="Search products"
        searchTrailingAction={(
          <>
            <span className="search-input-divider" aria-hidden="true" />
            <button
              ref={searchScanButtonRef}
              type="button"
              className="search-input-action"
              onClick={() => setIsSearchScannerOpen(true)}
              aria-label="Scan barcode to search products"
              title="Scan barcode"
            >
              <AppIcon name="barcode_scanner" aria-hidden="true" />
            </button>
          </>
        )}
        action={isAdmin && (
          <button type="button" className="create-button" onClick={openCreateModal}>
            <AppIcon name="add" />
            Create
          </button>
        )}
      />

      <div className="product-filter-bar">
        <div className="product-status-filter filter-inline-control">
          <label id="products-status-filter-label" className="filter-inline-label">Status</label>
          <FilterDropdown
            id="products-status-filter"
            className="product-status-dropdown filter-inline-dropdown"
            ariaLabelledBy="products-status-filter-label"
            value={statusFilter}
            options={PRODUCT_STATUS_OPTIONS}
            onChange={handleStatusFilterChange}
          />
        </div>
      </div>

      <Notification message={pageNotification.message} type={pageNotification.type} />
      <Notification message={notification.message} type={notification.type} />
      {productModal}

      {initialLoading ? (
        <PageLoader pageName="Products" />
      ) : (
      <>
      <DataTable id="products-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>SKU</th>
            <th>Product Name</th>
            <th className="table-col-number">Price</th>
            <th>Status</th>
            <th className="table-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="products-table-loading-row">
              <td colSpan={6}>
                <span className="products-table-loading-indicator" aria-hidden="true" />
                Loading products...
              </td>
            </tr>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <tr
                key={p.product_id}
                className={normalizeProductStatus(p.status) === 'inactive' ? "inactive-row" : ""}
              >
                <td>
                  <span className="table-id-chip">#{p.product_id}</span>
                </td>
                <td>{p.sku || '-'}</td>
                <td>{p.product_name}</td>
                <td className="table-col-number">{formatPeso(p.price)}</td>
                <td>
                  <span className={`delivery-status-pill status-${normalizeProductStatus(p.status)}`}>
                    {normalizeProductStatus(p.status) === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="table-col-actions">
                  <DataTableActions>
                    <button
                      className="edit-button"
                      onClick={() => openUpdateModal(p)}
                    >
                      <AppIcon name="edit" />
                      <span className="edit-text">Edit</span>
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(p.product_id)}
                    >
                      <AppIcon name="delete" />
                      <span className="delete-text">Delete</span>
                    </button>
                  </DataTableActions>
                </td>
              </tr>
            ))
          ) : (
            <DataTableEmptyState colSpan={6} message="No products found." />
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
      </>
      )}
    </div>
  );
};

export default ProductsList;



