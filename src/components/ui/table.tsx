import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={cn("min-w-full divide-y divide-gray-200", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return <thead className={cn("bg-gray-50", className)}>{children}</thead>;
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn("divide-y divide-gray-200 bg-white", className)}>{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return <tr className={cn("hover:bg-gray-50", className)}>{children}</tr>;
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider", className)}>
      {children}
    </th>
  );
}

interface TableCellProps extends TableProps {
  colSpan?: number;
}

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return <td className={cn("px-4 py-3 text-sm text-gray-900", className)} colSpan={colSpan}>{children}</td>;
}
