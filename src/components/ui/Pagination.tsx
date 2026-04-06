import { useState, useEffect } from "react";
import type { ChangeEvent, KeyboardEvent } from 'react';
import AppIcon from './AppIcon';
import FilterDropdown from './FilterDropdown';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalRows: number;
};

const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalRows }: PaginationProps) => {
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  if (totalRows === 0) return null;

  const getOptions = () => {
    const MAX = 50;
    const options = [];
    for (let i = 10; i <= Math.min(totalRows, MAX); i += 10) {
      options.push(i);
    }
    if (totalRows <= MAX && totalRows % 10 !== 0) {
      options.push(totalRows);
    }
    if (options.length === 0) options.push(totalRows);
    return options;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputCommit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleInputCommit();
  };

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;
  const pageSizeOptions = getOptions().map((opt) => ({ value: String(opt), label: String(opt) }));
  const selectedPageSize = String(pageSize);

  return (
    <div className="pagination-footer">
      <div className="rows-per-page">
        <span>Rows per page:</span>
        <FilterDropdown
          id="rows-per-page"
          className="rows-per-page-dropdown filter-inline-dropdown"
          ariaLabel="Rows per page"
          value={selectedPageSize}
          options={pageSizeOptions}
          onChange={(nextValue) => onPageSizeChange(Number(nextValue))}
        />
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={isFirst} title="First page">
            <AppIcon name="first_page" />
          </button>
          <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={isFirst} title="Previous page">
            <AppIcon name="chevron_left" />
          </button>

          <input
            className="pagination-input"
            type="number"
            min={1}
            max={totalPages}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputCommit}
            onKeyDown={handleKeyDown}
          />
          <span className="pagination-of">of {totalPages}</span>

          <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={isLast} title="Next page">
            <AppIcon name="chevron_right" />
          </button>
          <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={isLast} title="Last page">
            <AppIcon name="last_page" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
