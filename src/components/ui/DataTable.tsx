import type { ReactNode } from 'react';

type DataTableProps = {
  children: ReactNode;
  id?: string;
  ariaLabel?: string;
  tableClassName?: string;
  wrapperClassName?: string;
};

type DataTableEmptyStateProps = {
  colSpan: number;
  message: string;
};

type DataTableActionsProps = {
  children: ReactNode;
  className?: string;
};

const joinClasses = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(' ');

const DataTable = ({ children, id, ariaLabel, tableClassName, wrapperClassName }: DataTableProps) => (
  <div className={joinClasses('data-table-wrap', wrapperClassName)}>
    <table id={id} aria-label={ariaLabel} className={joinClasses('data-table', tableClassName)}>
      {children}
    </table>
  </div>
);

export const DataTableEmptyState = ({ colSpan, message }: DataTableEmptyStateProps) => (
  <tr className="table-empty-row">
    <td colSpan={colSpan}>{message}</td>
  </tr>
);

export const DataTableActions = ({ children, className }: DataTableActionsProps) => (
  <div className={joinClasses('table-row-actions', className)}>
    {children}
  </div>
);

export default DataTable;
