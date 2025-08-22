'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTableSortList } from '@/components/ui/table/data-table-sort-list';
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection
} from '@/components/ui/table/data-table-action-bar';
import { useDataTable } from '@/hooks/use-data-table';
import { useAutoSelection } from '@/hooks/use-auto-selection';
import { useSettings } from '@/contexts/SettingsContext';
import { AutoSelectionControls } from '@/components/settings/auto-selection/auto-selection-controls';
import type { MempoolTransaction } from '@/types/index';
import { createValidatedTransactionColumns } from './transaction-columns';
import { SelectedTransactionsModal } from '../../../components/modal/selected-transactions-modal';
import React from 'react';
import { TransactionSummaryModal } from '@/components/modal/transaction-summary-modal';
import { ValidationStatus } from '@/components/ui/validation-status';
import { Download, Eye, BarChart3, Copy, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { copyTransactionIds, exportTransactionsToCSV } from '@/lib/utils';
import { useJobDeclarationActions } from '@/contexts/JobDeclarationContext';
import { useTransactionValidation } from '@/hooks/use-transaction-validation';

interface Props {
  data: MempoolTransaction[];
  isFetching: boolean;
  onToggle: () => void;
  showAutoSelectionControls?: boolean;
}

export function TransactionsTable({
  data,
  isFetching,
  onToggle,
  showAutoSelectionControls = false
}: Props) {
  const [isSelectedModalOpen, setIsSelectedModalOpen] = React.useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);
  const {
    declareJob,
    isLoading: isDeclaring,
    currentTemplateId
  } = useJobDeclarationActions();

  const { settings } = useSettings();

  // Initialize transaction validation hooks
  const { canAddTransaction } = useTransactionValidation({
    transactions: data,
    selectedTransactions: [], // Will be updated after table initialization
    enableRealTimeValidation: true
  });

  // Create a ref to hold the table instance
  const tableRef = React.useRef<any>(null);

  // Create validation-aware columns for manual selection
  const columns = React.useMemo(
    () =>
      createValidatedTransactionColumns({
        canAddTransaction,
        onRowSelection: (txid: string, selected: boolean) => {
          // Find and toggle the specific row
          try {
            const row = tableRef.current?.getRow(txid);
            if (row) {
              row.toggleSelected(selected);
            }
          } catch (error) {
            console.warn(`Transaction ${txid} not found in current table data`);
          }
        },
        onSelectAll: (selected: boolean) => {
          // Toggle all page rows
          tableRef.current?.toggleAllPageRowsSelected(selected);
        }
      }),
    [canAddTransaction]
  );

  const { table } = useDataTable<MempoolTransaction>({
    data,
    columns: columns as any,
    getRowId: (r) => r.txid
  });

  // Store table reference
  React.useEffect(() => {
    tableRef.current = table;
  }, [table]);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedData = React.useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  );

  // Get selected transaction IDs for auto-selection
  const selectedTxids = React.useMemo(
    () => selectedData.map((tx) => tx.txid),
    [selectedData]
  );

  // Get updated validation state with actual selected transactions
  const {
    selectionSummary,
    validationState,
    cleanAndOptimizeSelection,
    removeInvalidTransactions
  } = useTransactionValidation({
    transactions: data,
    selectedTransactions: selectedData,
    enableRealTimeValidation: true
  });

  // Auto-clean invalid transactions when validation fails
  React.useEffect(() => {
    if (
      selectedData.length > 0 &&
      !validationState.isValid &&
      settings.general.autoCleanInvalidTransactions
    ) {
      const cleanupResult = cleanAndOptimizeSelection(selectedData);

      if (cleanupResult.removedTransactions.length > 0) {
        // Deselect all currently selected rows
        table.toggleAllRowsSelected(false);

        // Select only the valid transactions
        setTimeout(() => {
          cleanupResult.optimizedTransactions.forEach((tx) => {
            try {
              const row = table.getRow(tx.txid);
              if (row) {
                row.toggleSelected(true);
              }
            } catch (error) {
              console.warn(
                `Transaction ${tx.txid} not found in current table data`
              );
            }
          });
        }, 100);

        // Show notification about cleanup
        toast.warning('Invalid transactions removed', {
          description: `Removed ${cleanupResult.removedTransactions.length} invalid transaction(s). ${cleanupResult.summary}`,
          action: {
            label: 'Undo',
            onClick: () => {
              // Restore original selection
              table.toggleAllRowsSelected(false);
              setTimeout(() => {
                selectedData.forEach((tx) => {
                  try {
                    const row = table.getRow(tx.txid);
                    if (row) {
                      row.toggleSelected(true);
                    }
                  } catch (error) {
                    console.warn(`Transaction ${tx.txid} not found`);
                  }
                });
              }, 100);
            }
          }
        });
      }
    }
  }, [
    validationState.isValid,
    selectedData.length,
    cleanAndOptimizeSelection,
    table,
    settings.general.autoCleanInvalidTransactions
  ]);

  // Manual cleanup function
  const handleCleanInvalidTransactions = React.useCallback(() => {
    if (selectedData.length === 0) {
      toast.info('No transactions selected to clean');
      return;
    }

    const cleanupResult = cleanAndOptimizeSelection(selectedData);

    if (cleanupResult.removedTransactions.length === 0) {
      toast.success('All selected transactions are valid');
      return;
    }

    // Deselect all and select only valid ones
    table.toggleAllRowsSelected(false);

    setTimeout(() => {
      cleanupResult.optimizedTransactions.forEach((tx) => {
        try {
          const row = table.getRow(tx.txid);
          if (row) {
            row.toggleSelected(true);
          }
        } catch (error) {
          console.warn(
            `Transaction ${tx.txid} not found in current table data`
          );
        }
      });
    }, 100);

    toast.success('Selection cleaned', {
      description: `Removed ${cleanupResult.removedTransactions.length} invalid transaction(s). ${cleanupResult.summary}`
    });
  }, [selectedData, cleanAndOptimizeSelection, table]);

  // Handle transaction selection for auto-selection
  const handleSelectTransactions = React.useCallback(
    (txids: string[]) => {
      if (txids.length === 0) {
        table.toggleAllRowsSelected(false);
        return;
      }

      // Select the new transactions
      txids.forEach((txid) => {
        try {
          const row = table.getRow(txid);
          if (row) {
            row.toggleSelected(true);
          }
        } catch (error) {
          console.warn(`Transaction ${txid} not found in current table data`);
        }
      });
    },
    [table]
  );

  // Initialize auto-selection
  const { handleManualAutoSelection } = useAutoSelection({
    transactions: data,
    onSelectTransactions: handleSelectTransactions,
    selectedTxids,
    currentTemplateId,
    isFetching,
    onToggleFetching: onToggle,
    onDeclareJob: declareJob
  });

  const handleSelectedModal = (open: boolean) => {
    if (open) {
      setIsSelectedModalOpen(true);
      if (isFetching) onToggle();
    } else {
      setIsSelectedModalOpen(false);
      if (!isFetching) onToggle();
    }
  };

  const handleExportSelected = async () => {
    setIsExporting(true);
    try {
      await exportTransactionsToCSV(selectedData);
    } catch (error) {
      toast.error(
        'Export failed: There was an error exporting the selected transactions: '
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySelected = async () => {
    setIsCopying(true);
    try {
      await copyTransactionIds(selectedData);
    } catch (error) {
      toast.error(
        'Copy failed: There was an error copying the selected transaction IDs.'
      );
    } finally {
      setIsCopying(false);
    }
  };

  const handleDeclareJob = async () => {
    // Check validation before declaring job
    if (!validationState.isValid) {
      toast.error('Cannot declare job', {
        description:
          'Selected transactions violate Bitcoin mining criteria. Please fix validation issues first.'
      });
      return;
    }

    const txids = selectedData.map((tx) => tx.txid);
    const success = await declareJob(txids);

    if (success) {
      table.toggleAllRowsSelected(false);
    }
  };

  const actionBar = (
    <DataTableActionBar table={table} className='rounded-xl p-4'>
      <DataTableActionBarSelection table={table} />
      <DataTableActionBarAction
        tooltip={
          !validationState.isValid
            ? 'Fix validation issues before declaring job'
            : currentTemplateId
              ? `Declare job with selected transactions (Template ID: ${currentTemplateId})`
              : 'Wait for template notification to declare job'
        }
        onClick={handleDeclareJob}
        isPending={isDeclaring}
        disabled={!validationState.isValid || !currentTemplateId}
      >
        <Send />
        Declare Job
      </DataTableActionBarAction>
      <DataTableActionBarAction
        tooltip='View selected transactions'
        onClick={() => handleSelectedModal(true)}
      >
        <Eye />
        View Selected
      </DataTableActionBarAction>
      <DataTableActionBarAction
        tooltip='Show summary of selected transactions'
        onClick={() => setIsSummaryModalOpen(true)}
      >
        <BarChart3 />
        Summary
      </DataTableActionBarAction>
      <DataTableActionBarAction
        tooltip='Copy transaction IDs to clipboard'
        onClick={handleCopySelected}
        isPending={isCopying}
      >
        <Copy />
        Copy IDs
      </DataTableActionBarAction>
      <DataTableActionBarAction
        tooltip='Export selected transactions to CSV'
        onClick={handleExportSelected}
        isPending={isExporting}
      >
        <Download />
        Export
      </DataTableActionBarAction>
      <DataTableActionBarAction
        tooltip='Remove invalid transactions from selection'
        onClick={handleCleanInvalidTransactions}
        disabled={selectedData.length === 0}
      >
        <Trash2 />
        Remove Invalid
      </DataTableActionBarAction>
    </DataTableActionBar>
  );

  return (
    <>
      {/* Validation Status Display */}
      <ValidationStatus
        validationState={validationState}
        selectionSummary={selectionSummary}
        selectedCount={selectedData.length}
      />

      <Card>
        <div className='px-4'>
          <DataTable table={table} actionBar={actionBar}>
            {showAutoSelectionControls && (
              <AutoSelectionControls
                transactions={data}
                currentTemplateId={currentTemplateId}
                onSelectTransactions={handleSelectTransactions}
                selectedTxids={selectedTxids}
                isFetching={isFetching}
                onToggleFetching={onToggle}
                onManualAutoSelection={handleManualAutoSelection}
              />
            )}
            <div className='flex items-center gap-2'>
              <DataTableToolbar table={table} />
              <Button
                variant={isFetching ? 'destructive' : 'default'}
                size='sm'
                onClick={onToggle}
              >
                {isFetching ? 'Pause' : 'Resume'}
              </Button>
              <DataTableSortList table={table} />
            </div>
          </DataTable>
        </div>
      </Card>
      <TransactionSummaryModal
        isOpen={isSummaryModalOpen}
        selectedData={selectedData}
        handleModal={setIsSummaryModalOpen}
      />
      <SelectedTransactionsModal
        isOpen={isSelectedModalOpen}
        selectedData={selectedData}
        parentTable={table}
        handleModal={handleSelectedModal}
      />
    </>
  );
}
