import type { ReactNode } from 'react';
import AppIcon from './AppIcon';

type ListPageHeaderProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchAriaLabel?: string;
  searchTrailingAction?: ReactNode;
  action?: ReactNode;
};

const ListPageHeader = ({
  title,
  subtitle,
  kicker,
  searchInput,
  onSearchChange,
  searchAriaLabel,
  searchTrailingAction,
  action,
}: ListPageHeaderProps) => (
  <section className="header-row page-shell-header" aria-label={`${title} page header`}>
    <div className="page-shell-heading">
      {kicker ? <p className="page-shell-kicker">{kicker}</p> : null}
      <h2>{title}</h2>
      {subtitle ? <p className="page-shell-subtitle">{subtitle}</p> : null}
    </div>

    <div className="search-container page-shell-controls">
      <div className="search-input-wrapper">
        <AppIcon name="search" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchAriaLabel || `Search ${title.toLowerCase()}`}
        />
        {searchTrailingAction}
      </div>
      {action}
    </div>
  </section>
);

export default ListPageHeader;
