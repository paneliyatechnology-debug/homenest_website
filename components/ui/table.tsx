'use client';

import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { EmptyState } from './empty-state';
import { TablePagination } from './table-pagination';

/**
 * Outer Table Card Container
 */
export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Table Scroll Wrapper
 */
export interface TableScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  minHeight?: string;
  className?: string;
}

export const TableScroll: React.FC<TableScrollProps> = ({
  children,
  minHeight = 'min-h-[360px]',
  className = '',
  ...props
}) => {
  return (
    <div className={`overflow-x-auto ${minHeight} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Standard Styled Table Component
 */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <table
      className={`w-full text-left border-collapse text-xs sm:text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  );
};

/**
 * Table Header (thead)
 */
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead {...props}>
      <tr className={`border-b border-gray-100 text-gray-500 font-medium text-xs ${className}`}>
        {children}
      </tr>
    </thead>
  );
};

/**
 * Table Body (tbody)
 */
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-gray-100/80 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

/**
 * Table Row (tr)
 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-gray-50/70 transition-colors group text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

/**
 * Table Head Cell (th)
 */
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th className={`py-4 px-4 font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
};

/**
 * Table Body Cell (td)
 */
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td className={`py-4 px-4 text-gray-700 font-medium ${className}`} {...props}>
      {children}
    </td>
  );
};

/**
 * Standard Table Loading State
 */
export interface TableLoadingProps {
  label?: string;
  className?: string;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  label = 'Loading records...',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-24 gap-3 ${className}`}
    >
      <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
};

/**
 * Standard Table Empty State
 */
export interface TableEmptyProps {
  title?: string;
  description?: string;
  className?: string;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  title = 'No Records Found',
  description = 'No records match your criteria.',
  className = '',
}) => {
  return <EmptyState title={title} description={description} className={className} />;
};

/**
 * Generic Column Definition
 */
export interface ColumnDef<T> {
  key?: string;
  header: React.ReactNode;
  headerClassName?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cell: (item: T, index: number) => React.ReactNode;
}

/**
 * Standard Pagination Configuration for DataTable
 */
export interface DataTablePaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  itemCount?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

/**
 * Unified, Professional DataTable Component
 */
export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: DataTablePaginationProps;
  keyExtractor?: (item: T, index: number) => string | number;
  minHeight?: string;
  containerClassName?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingLabel = 'Loading records...',
  emptyTitle = 'No Records Found',
  emptyDescription = 'No records match your criteria.',
  pagination,
  keyExtractor,
  minHeight = 'min-h-[360px]',
  containerClassName = '',
  className = '',
}: DataTableProps<T>) {
  return (
    <div className="space-y-4 w-full">
      <TableContainer className={containerClassName}>
        <TableScroll minHeight={minHeight}>
          {loading ? (
            <TableLoading label={loadingLabel} />
          ) : data.length === 0 ? (
            <TableEmpty title={emptyTitle} description={emptyDescription} />
          ) : (
            <table className={`w-full text-left border-collapse text-xs sm:text-sm ${className}`}>
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold text-xs">
                  {columns.map((col, idx) => {
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left';
                    return (
                      <th
                        key={col.key || idx}
                        style={col.width ? { width: col.width } : undefined}
                        className={`py-4 px-4 ${alignClass} ${col.headerClassName || ''}`}
                      >
                        {col.header}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {data.map((item, rowIdx) => {
                  const rowKey = keyExtractor
                    ? keyExtractor(item, rowIdx)
                    : ((item as Record<string, unknown>)?.id as string | number) ?? rowIdx;
                  return (
                    <tr
                      key={rowKey}
                      className="hover:bg-gray-50/70 transition-colors group text-gray-700"
                    >
                      {columns.map((col, colIdx) => {
                        const alignClass =
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left';
                        return (
                          <td
                            key={col.key || colIdx}
                            className={`py-4 px-4 ${alignClass} ${col.className || ''}`}
                          >
                            {col.cell(item, rowIdx)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableScroll>
      </TableContainer>

      {/* Standalone Pagination Footer separated from table card matching Figma */}
      {pagination && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize || 10}
          itemCount={pagination.itemCount !== undefined ? pagination.itemCount : data.length}
          itemLabel={pagination.itemLabel}
          loading={loading}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
