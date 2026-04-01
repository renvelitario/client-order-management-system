import { useState, useEffect } from "react";

const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalRows }) => {
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

  const handleInputChange = (e) => {
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleInputCommit();
  };

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <div className="pagination-footer">
      <div className="rows-per-page">
        <span>Rows per page:</span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {getOptions().map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={isFirst} title="First page">
            <span className="material-icons">first_page</span>
          </button>
          <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={isFirst} title="Previous page">
            <span className="material-icons">chevron_left</span>
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
            <span className="material-icons">chevron_right</span>
          </button>
          <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={isLast} title="Last page">
            <span className="material-icons">last_page</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
