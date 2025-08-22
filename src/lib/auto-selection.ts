import type { MempoolTransaction, AutoSelectionCriteria } from '@/types/index';

export class AutoSelectionService {
  // Filters transactions based on auto-selection criteria

  static filterTransactions(
    transactions: MempoolTransaction[],
    criteria: AutoSelectionCriteria
  ): MempoolTransaction[] {
    if (!criteria.enabled) {
      return [];
    }

    let filtered = transactions.filter((tx) => {
      if (tx.feeRate < criteria.minFeeRate) {
        return false;
      }

      if (criteria.maxSize !== undefined && tx.vsize > criteria.maxSize) {
        return false;
      }

      if (
        criteria.minBaseFee !== undefined &&
        tx.fees.base < criteria.minBaseFee
      ) {
        return false;
      }

      if (
        criteria.maxAncestorCount !== undefined &&
        tx.ancestor_count > criteria.maxAncestorCount
      ) {
        return false;
      }
      if (
        criteria.maxDescendantCount !== undefined &&
        tx.descendant_count > criteria.maxDescendantCount
      ) {
        return false;
      }

      if (criteria.excludeBip125Replaceable && tx.bip125_replaceable) {
        return false;
      }

      if (criteria.excludeUnbroadcast && tx.unbroadcast) {
        return false;
      }

      return true;
    });

    if (criteria.maxTransactionCount !== undefined) {
      filtered = filtered.slice(0, criteria.maxTransactionCount);
    }

    return filtered;
  }

  // Gets a summary of how many transactions match the criteria
  static getMatchingSummary(
    transactions: MempoolTransaction[],
    criteria: AutoSelectionCriteria
  ): {
    total: number;
    matching: number;
    willSelect: number;
  } {
    if (!criteria.enabled) {
      return { total: transactions.length, matching: 0, willSelect: 0 };
    }

    const matching = this.filterTransactions(transactions, criteria);
    const willSelect = criteria.maxTransactionCount
      ? Math.min(matching.length, criteria.maxTransactionCount)
      : matching.length;

    return {
      total: transactions.length,
      matching: matching.length,
      willSelect
    };
  }

  // Validates auto-selection criteria
  static validateCriteria(criteria: AutoSelectionCriteria): string[] {
    const errors: string[] = [];

    if (
      criteria.maxTransactionCount !== undefined &&
      criteria.maxTransactionCount <= 0
    ) {
      errors.push('Maximum transaction count must be greater than 0');
    }

    return errors;
  }

  static getCriteriaDescription(criteria: AutoSelectionCriteria): string {
    if (!criteria.enabled) {
      return 'Auto-selection is disabled';
    }

    const parts: string[] = [];

    parts.push(`Min fee rate: ${criteria.minFeeRate} sat/vB`);

    if (criteria.maxSize !== undefined) {
      parts.push(`Max size: ${criteria.maxSize} vBytes`);
    }

    if (criteria.maxTransactionCount !== undefined) {
      parts.push(`Max ${criteria.maxTransactionCount} transactions`);
    }

    if (criteria.excludeBip125Replaceable) {
      parts.push('Exclude BIP125 replaceable');
    }

    if (criteria.excludeUnbroadcast) {
      parts.push('Exclude unbroadcast');
    }

    return parts.length > 0 ? parts.join(', ') : 'No specific criteria';
  }
}
