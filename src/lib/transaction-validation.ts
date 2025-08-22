import type { MempoolTransaction } from '@/types/index';

export const BITCOIN_MINING_CONSTRAINTS = {
  MAX_BLOCK_WEIGHT: 4_000_000, // 4M weight units
  MAX_BLOCK_SIZE: 1_000_000 // 1MB for legacy calculations
} as const;

export interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalWeight: number;
  weightUtilization: number;
  dependencyViolations: Array<{
    childTxid: string;
    missingParents: string[];
  }>;
}

export interface ValidationSummary {
  canSelect: boolean;
  totalSelectedWeight: number;
  remainingWeight: number;
  weightUtilization: number;
  dependencyIssues: number;
  message: string;
}

// Bitcoin Transaction Selection Validator
//
// Validates transaction selection based on Bitcoin mining criteria:
// 1. Block Size Limit - Total transaction weight must be ≤ 4,000,000 weight units
// 2. Parent-Child Dependencies - Include parent transactions before their dependent children
export class TransactionValidator {
  //  Validates a set of selected transactions for Bitcoin mining criteria
  static validateSelection(
    selectedTransactions: MempoolTransaction[],
    allTransactions: MempoolTransaction[]
  ): TransactionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const totalWeight = this.calculateTotalWeight(selectedTransactions);
    const weightUtilization =
      (totalWeight / BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT) * 100;

    if (totalWeight > BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT) {
      errors.push(
        `Total weight (${totalWeight.toLocaleString()}) exceeds Bitcoin block limit (${BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT.toLocaleString()})`
      );
    }

    // Check parent-child dependencies
    const dependencyViolations = this.checkDependencies(
      selectedTransactions,
      allTransactions
    );

    if (dependencyViolations.length > 0) {
      errors.push(
        `${dependencyViolations.length} transaction(s) have unmet dependencies. Child transactions require their parent transactions to be included.`
      );
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      totalWeight,
      weightUtilization,
      dependencyViolations
    };
  }

  // Validates if a new transaction can be added to current selection
  static canAddTransaction(
    newTransaction: MempoolTransaction,
    currentSelection: MempoolTransaction[],
    allTransactions: MempoolTransaction[]
  ): ValidationSummary {
    const proposedSelection = [...currentSelection, newTransaction];
    const validation = this.validateSelection(
      proposedSelection,
      allTransactions
    );

    const currentWeight = this.calculateTotalWeight(currentSelection);
    const newWeight = this.calculateTotalWeight([newTransaction]);
    const totalWeight = currentWeight + newWeight;

    const canSelect = validation.isValid;
    const remainingWeight =
      BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT - totalWeight;

    let message = '';
    if (!canSelect) {
      if (totalWeight > BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT) {
        message = `Cannot add transaction: would exceed block weight limit by ${(totalWeight - BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT).toLocaleString()} weight units`;
      } else if (validation.dependencyViolations.length > 0) {
        const missingParents =
          validation.dependencyViolations.find(
            (v) => v.childTxid === newTransaction.txid
          )?.missingParents || [];
        if (missingParents.length > 0) {
          message = `Cannot add transaction: missing ${missingParents.length} parent transaction(s)`;
        } else {
          message = `Cannot add transaction: would create dependency violations`;
        }
      }
    } else {
      message = `Can add transaction. Remaining capacity: ${remainingWeight.toLocaleString()} weight units (${((remainingWeight / BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT) * 100).toFixed(1)}%)`;
    }

    return {
      canSelect,
      totalSelectedWeight: totalWeight,
      remainingWeight,
      weightUtilization: validation.weightUtilization,
      dependencyIssues: validation.dependencyViolations.length,
      message
    };
  }

  // Validates if multiple transactions can be added to current selection
  static canAddTransactions(
    newTransactions: MempoolTransaction[],
    currentSelection: MempoolTransaction[],
    allTransactions: MempoolTransaction[]
  ): ValidationSummary {
    const proposedSelection = [...currentSelection, ...newTransactions];
    const validation = this.validateSelection(
      proposedSelection,
      allTransactions
    );

    const currentWeight = this.calculateTotalWeight(currentSelection);
    const newWeight = this.calculateTotalWeight(newTransactions);
    const totalWeight = currentWeight + newWeight;

    const canSelect = validation.isValid;
    const remainingWeight =
      BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT - totalWeight;

    let message = '';
    if (!canSelect) {
      if (totalWeight > BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT) {
        message = `Cannot add ${newTransactions.length} transaction(s): would exceed block weight limit by ${(totalWeight - BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT).toLocaleString()} weight units`;
      } else if (validation.dependencyViolations.length > 0) {
        message = `Cannot add ${newTransactions.length} transaction(s): would create ${validation.dependencyViolations.length} dependency violation(s)`;
      }
    } else {
      message = `Can add ${newTransactions.length} transaction(s). Remaining capacity: ${remainingWeight.toLocaleString()} weight units`;
    }

    return {
      canSelect,
      totalSelectedWeight: totalWeight,
      remainingWeight,
      weightUtilization: validation.weightUtilization,
      dependencyIssues: validation.dependencyViolations.length,
      message
    };
  }

  // Calculate total weight of transactions
  private static calculateTotalWeight(
    transactions: MempoolTransaction[]
  ): number {
    return transactions.reduce((total, tx) => {
      const weight = tx.weight || tx.vsize * 4;
      return total + weight;
    }, 0);
  }

  // Check parent-child dependencies
  private static checkDependencies(
    selectedTransactions: readonly MempoolTransaction[],
    allTransactions: readonly MempoolTransaction[]
  ): Array<{ childTxid: string; missingParents: string[] }> {
    const selected = new Set(selectedTransactions.map((tx) => tx.txid));
    const mempool = new Set(allTransactions.map((tx) => tx.txid));

    return selectedTransactions
      .map((tx) => {
        if (!tx.depends?.length) return null;

        const missing = Array.from(new Set(tx.depends)).filter(
          (parentId) =>
            mempool.has(parentId.toString()) &&
            !selected.has(parentId.toString())
        );

        return missing.length
          ? { childTxid: tx.txid, missingParents: missing }
          : null;
      })
      .filter(
        (x): x is { childTxid: string; missingParents: string[] } => x !== null
      );
  }

  // Get a summary of the current selection state
  static getSelectionSummary(
    selectedTransactions: MempoolTransaction[],
    allTransactions: MempoolTransaction[]
  ): string {
    if (selectedTransactions.length === 0) {
      return 'No transactions selected';
    }

    const validation = this.validateSelection(
      selectedTransactions,
      allTransactions
    );
    const weightPercent = validation.weightUtilization.toFixed(1);

    if (!validation.isValid) {
      return `Invalid selection: ${validation.errors.join(', ')}`;
    }

    return `${selectedTransactions.length} transaction(s) selected (${weightPercent}% block capacity)`;
  }

  // Sort transactions to resolve dependencies
  // Returns transactions in order where parents come before children
  static sortByDependencies(
    transactions: MempoolTransaction[]
  ): MempoolTransaction[] {
    const txMap = new Map(transactions.map((tx) => [tx.txid, tx]));
    const sorted: MempoolTransaction[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (txid: string) => {
      if (visited.has(txid)) return;
      if (visiting.has(txid)) {
        // Circular dependency detected, but we'll continue
        return;
      }

      visiting.add(txid);
      const tx = txMap.get(txid);

      if (tx) {
        // Visit dependencies first (parents)
        if (tx.depends && tx.depends.length > 0) {
          for (const parentTxid of tx.depends) {
            const parentId = String(parentTxid);
            if (txMap.has(parentId)) {
              visit(parentId);
            }
          }
        }

        visiting.delete(txid);
        visited.add(txid);
        sorted.push(tx);
      }
    };

    // Visit all transactions
    for (const tx of transactions) {
      visit(tx.txid);
    }

    return sorted;
  }

  // Remove invalid transactions from selected transaction list
  // Returns a cleaned list with only valid transactions
  static removeInvalidTransactions(
    selectedTransactions: MempoolTransaction[],
    allTransactions: MempoolTransaction[]
  ): {
    validTransactions: MempoolTransaction[];
    removedTransactions: MempoolTransaction[];
    issues: string[];
  } {
    const validTransactions: MempoolTransaction[] = [];
    const removedTransactions: MempoolTransaction[] = [];
    const issues: string[] = [];

    // First, check for transactions that would exceed weight limit
    let currentWeight = 0;
    const sortedByFeeRate = [...selectedTransactions].sort(
      (a, b) => b.feeRate - a.feeRate
    );

    for (const tx of sortedByFeeRate) {
      const txWeight = tx.weight || tx.vsize * 4;

      if (
        currentWeight + txWeight <=
        BITCOIN_MINING_CONSTRAINTS.MAX_BLOCK_WEIGHT
      ) {
        validTransactions.push(tx);
        currentWeight += txWeight;
      } else {
        removedTransactions.push(tx);
        issues.push(
          `Removed transaction ${tx.txid.slice(0, 8)}... (would exceed block weight limit)`
        );
      }
    }

    // Check for dependency violations in the valid set
    const validTxIds = new Set(validTransactions.map((tx) => tx.txid));
    const mempoolTxIds = new Set(allTransactions.map((tx) => tx.txid));
    const finalValidTransactions: MempoolTransaction[] = [];
    const dependencyRemovedTransactions: MempoolTransaction[] = [];

    for (const tx of validTransactions) {
      let hasValidDependencies = true;

      if (tx.depends && tx.depends.length > 0) {
        for (const parentId of tx.depends) {
          const parentIdStr = String(parentId);
          // If parent is in mempool but not in our valid selection, transaction is invalid
          if (mempoolTxIds.has(parentIdStr) && !validTxIds.has(parentIdStr)) {
            hasValidDependencies = false;
            break;
          }
        }
      }

      if (hasValidDependencies) {
        finalValidTransactions.push(tx);
      } else {
        dependencyRemovedTransactions.push(tx);
        issues.push(
          `Removed transaction ${tx.txid.slice(0, 8)}... (missing parent dependencies)`
        );
      }
    }

    // Sort final valid transactions by dependencies to ensure proper order
    const sortedValidTransactions = this.sortByDependencies(
      finalValidTransactions
    );

    return {
      validTransactions: sortedValidTransactions,
      removedTransactions: [
        ...removedTransactions,
        ...dependencyRemovedTransactions
      ],
      issues
    };
  }

  // Automatically clean and optimize selected transactions
  // Removes invalid transactions and returns optimized selection
  static cleanAndOptimizeSelection(
    selectedTransactions: MempoolTransaction[],
    allTransactions: MempoolTransaction[]
  ): {
    optimizedTransactions: MempoolTransaction[];
    removedTransactions: MempoolTransaction[];
    summary: string;
    issues: string[];
  } {
    if (selectedTransactions.length === 0) {
      return {
        optimizedTransactions: [],
        removedTransactions: [],
        summary: 'No transactions to clean',
        issues: []
      };
    }

    const result = this.removeInvalidTransactions(
      selectedTransactions,
      allTransactions
    );
    const validation = this.validateSelection(
      result.validTransactions,
      allTransactions
    );

    const summary =
      result.validTransactions.length === 0
        ? 'All transactions were invalid and removed'
        : `Cleaned selection: ${result.validTransactions.length} valid transactions remaining (${validation.weightUtilization.toFixed(1)}% block capacity)`;

    return {
      optimizedTransactions: result.validTransactions,
      removedTransactions: result.removedTransactions,
      summary,
      issues: result.issues
    };
  }
}
