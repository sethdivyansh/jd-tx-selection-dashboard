import React from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { Table } from '@tanstack/react-table';
import type { MempoolTransaction } from '@/types/index';
import { useTransactionValidation } from '@/hooks/use-transaction-validation';
import { toast } from 'sonner';

interface ValidatedDataTableProps {
  table: Table<MempoolTransaction>;
  actionBar?: React.ReactNode;
  children?: React.ReactNode;
  transactions: MempoolTransaction[];
}

/**
 * A wrapper around DataTable that adds transaction selection validation
 */
export function ValidatedDataTable({
  table,
  actionBar,
  children,
  transactions
}: ValidatedDataTableProps) {
  const selectedData = React.useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [table]
  );

  const { canAddTransaction } = useTransactionValidation({
    transactions,
    selectedTransactions: selectedData,
    enableRealTimeValidation: true
  });

  // Intercept checkbox clicks to add validation
  React.useEffect(() => {
    const handleCheckboxClick = (event: Event) => {
      const target = event.target as HTMLElement;

      // Check if this is a transaction selection checkbox
      if (
        target instanceof HTMLInputElement &&
        target.type === 'checkbox' &&
        target.getAttribute('aria-label')?.includes('Select row')
      ) {
        const row = target.closest('tr');
        if (!row) return;

        const rowIndex =
          Array.from(row.parentNode?.children || []).indexOf(row) - 1; // -1 for header
        if (rowIndex < 0) return;

        const tableRow = table.getRowModel().rows[rowIndex];
        if (!tableRow) return;

        const transaction = tableRow.original;
        const willBeSelected = target.checked;

        // If trying to select and validation fails, prevent the action
        if (willBeSelected) {
          const validation = canAddTransaction(transaction);
          if (!validation.canSelect) {
            event.preventDefault();
            event.stopPropagation();
            target.checked = false;

            toast.error('Cannot select transaction', {
              description: validation.message
            });
            return;
          }
        }
      }
    };

    // Add event listener to capture checkbox clicks
    document.addEventListener('click', handleCheckboxClick, true);

    return () => {
      document.removeEventListener('click', handleCheckboxClick, true);
    };
  }, [table, canAddTransaction]);

  return (
    <DataTable table={table} actionBar={actionBar}>
      {children}
    </DataTable>
  );
}
