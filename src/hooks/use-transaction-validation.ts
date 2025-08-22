import React from 'react';
import type { MempoolTransaction } from '@/types/index';
import {
  TransactionValidator,
  type ValidationSummary
} from '@/lib/transaction-validation';

interface UseTransactionValidationOptions {
  transactions: MempoolTransaction[];
  selectedTransactions: MempoolTransaction[];
  enableRealTimeValidation?: boolean;
}

interface UseTransactionValidationReturn {
  /**
   * Check if a transaction can be added to the current selection
   */
  canAddTransaction: (transaction: MempoolTransaction) => ValidationSummary;

  /**
   * Check if multiple transactions can be added to the current selection
   */
  canAddTransactions: (transactions: MempoolTransaction[]) => ValidationSummary;

  /**
   * Validate the current selection
   */
  validateCurrentSelection: () => ReturnType<
    typeof TransactionValidator.validateSelection
  >;

  /**
   * Remove invalid transactions from selection
   */
  removeInvalidTransactions: (
    selectedTransactions: MempoolTransaction[]
  ) => ReturnType<typeof TransactionValidator.removeInvalidTransactions>;

  /**
   * Clean and optimize the current selection
   */
  cleanAndOptimizeSelection: (
    selectedTransactions: MempoolTransaction[]
  ) => ReturnType<typeof TransactionValidator.cleanAndOptimizeSelection>;

  /**
   * Get a summary of the current selection state
   */
  selectionSummary: string;

  /**
   * Current validation state
   */
  validationState: {
    isValid: boolean;
    totalWeight: number;
    weightUtilization: number;
    dependencyIssues: number;
    canAddMore: boolean;
    remainingCapacity: number;
  };

  /**
   * Sort transactions by dependencies (parents before children)
   */
  sortByDependencies: (
    transactions: MempoolTransaction[]
  ) => MempoolTransaction[];
}

/**
 * React hook for Bitcoin transaction selection validation
 *
 * Provides validation utilities for checking transaction selection
 * against Bitcoin mining criteria (block weight limits and dependencies)
 */
export function useTransactionValidation({
  transactions,
  selectedTransactions,
  enableRealTimeValidation = true
}: UseTransactionValidationOptions): UseTransactionValidationReturn {
  // Memoize validation results to avoid unnecessary recalculations
  const validationResult = React.useMemo(() => {
    if (!enableRealTimeValidation || selectedTransactions.length === 0) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        totalWeight: 0,
        weightUtilization: 0,
        dependencyViolations: []
      };
    }

    return TransactionValidator.validateSelection(
      selectedTransactions,
      transactions
    );
  }, [selectedTransactions, transactions, enableRealTimeValidation]);

  // Memoize selection summary
  const selectionSummary = React.useMemo(() => {
    return TransactionValidator.getSelectionSummary(
      selectedTransactions,
      transactions
    );
  }, [selectedTransactions, transactions]);

  // Memoize validation state
  const validationState = React.useMemo(() => {
    const remainingCapacity = Math.max(
      0,
      4_000_000 - validationResult.totalWeight
    );

    return {
      isValid: validationResult.isValid,
      totalWeight: validationResult.totalWeight,
      weightUtilization: validationResult.weightUtilization,
      dependencyIssues: validationResult.dependencyViolations.length,
      canAddMore: remainingCapacity > 0 && validationResult.isValid,
      remainingCapacity
    };
  }, [validationResult]);

  // Callback to check if a single transaction can be added
  const canAddTransaction = React.useCallback(
    (transaction: MempoolTransaction): ValidationSummary => {
      return TransactionValidator.canAddTransaction(
        transaction,
        selectedTransactions,
        transactions
      );
    },
    [selectedTransactions, transactions]
  );

  // Callback to check if multiple transactions can be added
  const canAddTransactions = React.useCallback(
    (newTransactions: MempoolTransaction[]): ValidationSummary => {
      return TransactionValidator.canAddTransactions(
        newTransactions,
        selectedTransactions,
        transactions
      );
    },
    [selectedTransactions, transactions]
  );

  // Callback to validate current selection
  const validateCurrentSelection = React.useCallback(() => {
    return TransactionValidator.validateSelection(
      selectedTransactions,
      transactions
    );
  }, [selectedTransactions, transactions]);

  // Callback to sort transactions by dependencies
  const sortByDependencies = React.useCallback((txs: MempoolTransaction[]) => {
    return TransactionValidator.sortByDependencies(txs);
  }, []);

  // Callback to remove invalid transactions
  const removeInvalidTransactions = React.useCallback(
    (selectedTxs: MempoolTransaction[]) => {
      return TransactionValidator.removeInvalidTransactions(
        selectedTxs,
        transactions
      );
    },
    [transactions]
  );

  // Callback to clean and optimize selection
  const cleanAndOptimizeSelection = React.useCallback(
    (selectedTxs: MempoolTransaction[]) => {
      return TransactionValidator.cleanAndOptimizeSelection(
        selectedTxs,
        transactions
      );
    },
    [transactions]
  );

  return {
    canAddTransaction,
    canAddTransactions,
    validateCurrentSelection,
    removeInvalidTransactions,
    cleanAndOptimizeSelection,
    selectionSummary,
    validationState,
    sortByDependencies
  };
}
