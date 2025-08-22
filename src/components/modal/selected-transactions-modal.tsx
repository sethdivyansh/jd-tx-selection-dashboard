import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTableSortList } from '@/components/ui/table/data-table-sort-list';
import { ColumnDef, Row, Table as ReactTable } from '@tanstack/react-table';
import type { MempoolTransaction } from '@/types/index';
import { selectedTransactionColumns } from '@/features/overview/components/transaction-columns';
import { TransactionSummaryModal } from './transaction-summary-modal';
import { useJobDeclarationActions } from '@/contexts/JobDeclarationContext';
import { useDataTable } from '@/hooks/use-data-table';
import { Send } from 'lucide-react';

interface SelectedTransactionsModalProps {
  isOpen: boolean;
  selectedData: MempoolTransaction[];
  parentTable: ReactTable<MempoolTransaction>;
  handleModal: (open: boolean) => void;
}

export function SelectedTransactionsModal({
  isOpen,
  selectedData,
  parentTable,
  handleModal
}: SelectedTransactionsModalProps) {
  const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);
  const {
    declareJob,
    isLoading: isDeclaring,
    currentTemplateId
  } = useJobDeclarationActions();

  const handleDeclareJob = async () => {
    const txids = selectedData.map((tx) => tx.txid);
    const success = await declareJob(txids);

    if (success) {
      parentTable.toggleAllRowsSelected(false);
      setTimeout(() => handleModal(false), 1000);
    }
  };

  const customizedColumns = React.useMemo<ColumnDef<MempoolTransaction>[]>(
    () =>
      selectedTransactionColumns.map((col) => {
        if (col.id === 'select') {
          return {
            ...col,
            cell: ({ row }: { row: Row<MempoolTransaction> }) => {
              const getParentRow = () => {
                try {
                  return parentTable.getRow(row.original.txid);
                } catch {
                  return null;
                }
              };

              return (
                <Checkbox
                  checked={getParentRow()?.getIsSelected() ?? false}
                  onCheckedChange={(value) => {
                    const parentRow = getParentRow();
                    if (parentRow) {
                      parentRow.toggleSelected(!!value);
                    }
                  }}
                  aria-label='Select row'
                />
              );
            }
          } as ColumnDef<MempoolTransaction>;
        }
        return col;
      }),
    [parentTable]
  );

  const { table } = useDataTable<MempoolTransaction>({
    data: selectedData,
    columns: customizedColumns as any,
    getRowId: (r) => r.txid
  });

  return (
    <Modal
      title='Selected Transactions'
      description='Review the selected transactions'
      isOpen={isOpen}
      onClose={() => handleModal(false)}
      size='6xl'
    >
      <div className='max-h-[75vh] overflow-auto'>
        <DataTable table={table}>
          <div className='flex items-center gap-2 px-4 py-2'>
            <DataTableToolbar table={table} />
            <DataTableSortList table={table} />
            {selectedData.length > 0 && (
              <>
                <Button
                  variant={!currentTemplateId ? 'secondary' : 'default'}
                  size='sm'
                  onClick={handleDeclareJob}
                  disabled={!currentTemplateId || isDeclaring}
                >
                  <Send className='h-4 w-4' />
                  {isDeclaring ? 'Declaring...' : 'Declare Job'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsSummaryModalOpen(true)}
                >
                  Summary
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => {
                    parentTable.toggleAllRowsSelected(false);
                    setTimeout(() => handleModal(false), 800);
                  }}
                >
                  Deselect All
                </Button>
              </>
            )}
          </div>
        </DataTable>
      </div>

      <TransactionSummaryModal
        isOpen={isSummaryModalOpen}
        selectedData={selectedData}
        handleModal={setIsSummaryModalOpen}
      />
    </Modal>
  );
}
