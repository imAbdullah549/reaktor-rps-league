import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ColumnDef, DataTableProps } from "./types";

function buildColgroup<T>(columns: ColumnDef<T>[]) {
  return (
    <colgroup>
      {columns.map((col) => (
        <col key={col.id} style={col.width ? { width: col.width } : undefined} />
      ))}
    </colgroup>
  );
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  caption,
  scrollable = false,
  className,
}: DataTableProps<T>) {
  const tableClasses = "w-full caption-bottom text-sm table-fixed border-collapse";

  const headerTable = (
    <table className={tableClasses}>
      {buildColgroup(columns)}
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.id} className={col.headerClassName}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
    </table>
  );

  const bodyContent = (
    <table className={tableClasses}>
      {buildColgroup(columns)}
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              No results.
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((col) => {
                const content =
                  col.cell != null
                    ? col.cell(row)
                    : String((row as Record<string, unknown>)[col.id] ?? "");
                return (
                  <TableCell key={col.id} className={col.cellClassName}>
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </table>
  );

  if (scrollable) {
    return (
      <div
        className={cn(
          "flex flex-col flex-1 min-h-0 rounded-md border border-border overflow-hidden",
          className
        )}
      >
        <div className="shrink-0 border-b border-border bg-muted/30">{headerTable}</div>
        <ScrollArea className="flex-1 min-h-0">{bodyContent}</ScrollArea>
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border border-border", className)}>
      <Table>
        {caption != null && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.id} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((col) => {
                  const content =
                    col.cell != null
                      ? col.cell(row)
                      : String((row as Record<string, unknown>)[col.id] ?? "");
                  return (
                    <TableCell key={col.id} className={col.cellClassName}>
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
