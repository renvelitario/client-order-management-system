import type { ChangeEvent, FormEvent } from 'react';
import EntityModalShell from './EntityModalShell';
import Notification from './Notification';

type UserFormData = {
  email: string;
  username: string;
  name: string;
  password: string;
  confirm_password: string;
  acc_type: 'Admin' | 'User';
  status: 'Active' | 'Disabled';
};

type UserFormModalProps = {
  open: boolean;
  mode: 'create' | 'update';
  formData: UserFormData;
  error: string;
  isSubmitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRequestClose: () => void;
};

const UserFormModal = ({
  open,
  mode,
  formData,
  error,
  isSubmitting,
  onChange,
  onSubmit,
  onRequestClose,
}: UserFormModalProps) => {
  const isCreate = mode === 'create';

  return (
    <EntityModalShell
      open={open}
      title={isCreate ? 'Create / Sign Up User' : 'Update User'}
      titleId="user-modal-title"
      className="entity-form-modal"
      closeLabel="Close user form"
      onRequestClose={onRequestClose}
    >
      <Notification message={error} type="error" />

      <form className="entity-modal-form" onSubmit={onSubmit}>
        <div className="entity-modal-field">
          <label htmlFor="user-email">Email</label>
          <input
            id="user-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="name@example.com"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="user-username">Username</label>
          <input
            id="user-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            placeholder="Enter username"
            maxLength={200}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="entity-modal-field">
          <label htmlFor="user-name">Full Name</label>
          <input
            id="user-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Enter full name"
            maxLength={200}
            disabled={isSubmitting}
            required
          />
        </div>

        {isCreate ? (
          <>
            <div className="entity-modal-field">
              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder="At least 8 characters with letters and numbers"
                minLength={8}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="entity-modal-field">
              <label htmlFor="user-confirm-password">Confirm Password</label>
              <input
                id="user-confirm-password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={onChange}
                placeholder="Re-enter password"
                minLength={8}
                disabled={isSubmitting}
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="entity-modal-field">
              <label htmlFor="user-password">New Password</label>
              <input
                id="user-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder="Leave blank to keep current password"
                minLength={8}
                disabled={isSubmitting}
              />
              <p className="entity-modal-field-hint">Set only when the user needs a reset.</p>
            </div>

            <div className="entity-modal-field">
              <label htmlFor="user-confirm-password">Confirm New Password</label>
              <input
                id="user-confirm-password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={onChange}
                placeholder="Re-enter new password"
                minLength={8}
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        <div className="entity-modal-field-group">
          <div className="entity-modal-field">
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              name="acc_type"
              value={formData.acc_type}
              onChange={onChange}
              disabled={isSubmitting}
              required
            >
              <option value="Admin">Admin</option>
              <option value="User">Delivery User</option>
            </select>
          </div>

          <div className="entity-modal-field">
            <label htmlFor="user-status">Status</label>
            <select
              id="user-status"
              name="status"
              value={formData.status}
              onChange={onChange}
              disabled={isSubmitting}
              required
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div className="entity-modal-actions">
          <button type="button" className="modal-cancel" onClick={onRequestClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="create-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isCreate ? 'Create User' : 'Update User'}
          </button>
        </div>
      </form>
    </EntityModalShell>
  );
};

export default UserFormModal;
