import {
  ColumnDef,
  Row,
  HeaderContext,
  CellContext
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { TransactionCheckbox } from '@/components/ui/transaction-checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Text, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MempoolTransaction } from '@/types/index';
import React from 'react';

const renderCell = (content: React.ReactNode) => (
  <div className='flex h-8 items-center justify-center gap-1'>{content}</div>
);

// Component for txid cell with hover tooltip, copy functionality, and external link
const TxidCell: React.FC<{ txid: string }> = ({ txid }) => {
  const shortTxid = txid.slice(0, 4) + '...' + txid.slice(-4);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(txid);
      toast.success('Transaction ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy transaction ID');
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `https://mempool.space/tx/${txid}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='group flex cursor-pointer items-center gap-1'>
            <span
              onClick={handleCopy}
              className='transition-colors hover:text-blue-600'
            >
              {shortTxid}
            </span>
            <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
              <Button
                variant='ghost'
                size='sm'
                className='h-4 w-4 p-0 hover:bg-transparent'
                onClick={handleCopy}
                title='Copy full transaction ID'
              >
                <Copy className='h-3 w-3' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-4 w-4 p-0 hover:bg-transparent'
                onClick={handleExternalLink}
                title='View on mempool.space'
              >
                <ExternalLink className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          <div className='text-center font-mono text-xs'>{txid}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

type ColumnConfig = {
  id: string;
  accessorKey: string;
  title: string;
  formatter: (v: any) => React.ReactNode;
  meta?: any;
  enableSorting: boolean;
  enableColumnFilter: boolean;
  filterFn?: (row: Row<MempoolTransaction>, id: string, value: any) => boolean;
};

const columnsConfig: ColumnConfig[] = [
  {
    id: 'txid',
    accessorKey: 'txid',
    title: 'Txid',
    formatter: (v: string) => <TxidCell txid={v} />,
    meta: {
      label: 'txid',
      placeholder: 'Search by txid',
      variant: 'text',
      icon: Text
    },
    enableSorting: false,
    enableColumnFilter: true
  },
  {
    id: 'feeRate',
    accessorKey: 'feeRate',
    title: 'FeeRate (sat/vB)',
    formatter: (v: number) => v.toPrecision(4),
    meta: { label: 'Fee Rate', variant: 'range', range: [0, 1000] },
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'vsize',
    accessorKey: 'vsize',
    title: 'Size (vB)',
    formatter: (v: number) => v,
    meta: { label: 'vsize', variant: 'range', range: [0, 1000000] },
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'fees.base',
    accessorKey: 'fees.base',
    title: 'Base Fee (sat)',
    formatter: (v: number) => v.toLocaleString(),
    meta: { label: 'Base Fee', variant: 'range', range: [0, 1000000] },
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'depends',
    accessorKey: 'depends',
    title: 'Depends On',
    formatter: (v: string[] | null | undefined) => {
      if (!v || !Array.isArray(v)) return 0;
      const count = v.length;

      // Return just the count for proper sorting, with tooltip for context
      return (
        <span
          title={
            count > 0
              ? `Depends on: ${v
                  .slice(0, 3)
                  .map((txid) => txid.slice(0, 8) + '...')
                  .join(
                    ', '
                  )}${v.length > 3 ? ` and ${v.length - 3} more` : ''}`
              : 'No dependencies'
          }
        >
          {count}
        </span>
      );
    },
    meta: { label: 'Depends On', variant: 'number' },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row: Row<MempoolTransaction>, id: string, value: number) => {
      const depends = row.getValue<string[]>(id);
      if (!depends || !Array.isArray(depends)) return value === 0;
      return depends.length === Number(value);
    }
  },
  {
    id: 'descendant_count',
    accessorKey: 'descendant_count',
    title: 'Descendant Count',
    formatter: (v: number) => v,
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'descendant_size',
    accessorKey: 'descendant_size',
    title: 'Descendant Size',
    formatter: (v: number) => v,
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'ancestor_count',
    accessorKey: 'ancestor_count',
    title: 'Ancestor Count',
    formatter: (v: number) => v,
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'ancestor_size',
    accessorKey: 'ancestor_size',
    title: 'Ancestor Size',
    formatter: (v: number) => v,
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'time',
    accessorKey: 'time',
    title: 'Time',
    formatter: (v: number) => new Date(v * 1000).toLocaleString(),
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'height',
    accessorKey: 'height',
    title: 'Height',
    formatter: (v: number) => v,
    enableSorting: true,
    enableColumnFilter: true
  },
  {
    id: 'bip125_replaceable',
    accessorKey: 'bip125_replaceable',
    title: 'BIP125 Replaceable',
    formatter: (v: boolean) => <Checkbox checked={v} disabled />,
    meta: { label: 'BIP125 Replaceable', variant: 'boolean' },
    enableSorting: true,
    enableColumnFilter: true
  }
];

export const transactionColumns: ColumnDef<MempoolTransaction>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    meta: {
      label: 'Checkbox',
      placeholder: 'select transaction',
      variant: 'text',
      icon: Text
    },
    size: 32,
    enableHiding: false
  },

  ...columnsConfig.map((cfg) => ({
    id: cfg.id,
    accessorKey: cfg.accessorKey,
    header: ({ column }: HeaderContext<MempoolTransaction, any>) => (
      <DataTableColumnHeader
        column={column}
        title={cfg.title}
        className='w-full justify-center'
      />
    ),
    cell: ({ cell }: CellContext<MempoolTransaction, any>) =>
      renderCell(cfg.formatter(cell.getValue())),
    ...(cfg.meta && { meta: cfg.meta }),
    enableSorting: cfg.enableSorting,
    enableColumnFilter: cfg.enableColumnFilter,
    ...(cfg.filterFn && { filterFn: cfg.filterFn }),
    // Add custom sorting for depends column to ensure proper numerical sorting
    ...(cfg.id === 'depends' && {
      sortingFn: (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);
        const aLength = a && Array.isArray(a) ? a.length : 0;
        const bLength = b && Array.isArray(b) ? b.length : 0;
        return aLength - bLength;
      }
    })
  }))
];

export const selectedTransactionColumns: ColumnDef<MempoolTransaction>[] = [
  {
    id: 'select',
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    meta: {
      label: 'Checkbox',
      placeholder: 'deselect transaction',
      variant: 'text',
      icon: Text
    },
    size: 32,
    enableHiding: false
  },
  ...transactionColumns.slice(1, 5)
];

// Validated Transaction Columns with Custom Selection Logic
interface CreateValidatedColumnsOptions {
  canAddTransaction: (transaction: MempoolTransaction) => {
    canSelect: boolean;
    message: string;
  };
  onRowSelection: (txid: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

/**
 * Creates transaction columns with validation-aware selection checkboxes
 */
export function createValidatedTransactionColumns({
  canAddTransaction,
  onRowSelection,
  onSelectAll
}: CreateValidatedColumnsOptions): ColumnDef<MempoolTransaction>[] {
  const selectColumn: ColumnDef<MempoolTransaction> = {
    id: 'select',
    header: ({ table }) => {
      const allPageRows = table.getRowModel().rows;
      const selectedPageRows = allPageRows.filter((row) => row.getIsSelected());
      const isAllSelected =
        allPageRows.length > 0 &&
        selectedPageRows.length === allPageRows.length;
      const isPartiallySelected = selectedPageRows.length > 0 && !isAllSelected;

      return (
        <Checkbox
          checked={isAllSelected || (isPartiallySelected && 'indeterminate')}
          onCheckedChange={(value) => onSelectAll(!!value)}
          aria-label='Select all transactions'
        />
      );
    },
    cell: ({ row }) => {
      const transaction = row.original;
      const isSelected = row.getIsSelected();
      const validation = canAddTransaction(transaction);

      return (
        <TransactionCheckbox
          transaction={transaction}
          isSelected={isSelected}
          onSelectionChange={(selected) =>
            onRowSelection(transaction.txid, selected)
          }
          canSelect={validation.canSelect}
          validationMessage={validation.message}
        />
      );
    },
    meta: {
      label: 'Checkbox',
      placeholder: 'select transaction',
      variant: 'text',
      icon: Text
    },
    size: 32,
    enableHiding: false
  };

  // Return the select column followed by the rest of the original columns (excluding the original select column)
  return [selectColumn, ...transactionColumns.slice(1)];
}
