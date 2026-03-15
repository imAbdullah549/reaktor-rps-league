import type { ReactNode } from "react";

/**
 * Column definition for the generic DataTable.
 * - id: used as key and to read row[id] when cell is not provided
 * - header: what to render in the header (string or ReactNode)
 * - cell: optional custom cell renderer; if omitted, row[id] is rendered
 * - width: optional width for scrollable layout (e.g. "14%")
 */
export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  cell?: (row: T) => ReactNode;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Column definitions (header + optional cell renderer). */
  columns: ColumnDef<T>[];
  /** Table rows. */
  data: T[];
  /** Unique key for each row (e.g. (row) => row.id). */
  getRowKey: (row: T) => string;
  /** Optional caption below the table. */
  caption?: string;
  /** When true, header is fixed and only body scrolls. */
  scrollable?: boolean;
  className?: string;
}
