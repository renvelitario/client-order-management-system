import type { ReactNode } from 'react';

type ListPageHeaderProps = {
  title: string;
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchAriaLabel?: string;
  action?: ReactNode;
};

const ListPageHeader = ({
  title,
  searchInput,
  onSearchChange,
  searchAriaLabel,
  action,
}: ListPageHeaderProps) => (
  <div className="header-row">
    <h2>{title}</h2>
    <div className="search-container">
      <div className="search-input-wrapper">
        <span className="material-icons" aria-hidden="true">search</span>
        <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchAriaLabel}
        />
      </div>
      {action}
    </div>
  </div>
);

export default ListPageHeader;
