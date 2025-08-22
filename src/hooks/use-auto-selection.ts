import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { AutoSelectionService } from '@/lib/auto-selection';
import { toast } from 'sonner';
import type {
  MempoolTransaction,
  AutoSelectionCriteria,
  AppSettings
} from '@/types/index';
import { ApiResponse } from '@/app/api/proxy-api';

/**
 * Builds URLSearchParams from AutoSelectionCriteria in a type-safe way
 */
function buildAutoSelectionParams(
  criteria: AutoSelectionCriteria
): URLSearchParams {
  const params = new URLSearchParams();

  // Required parameters
  params.append('selectionStrategy', criteria.selectionStrategy);
  params.append('minFeeRate', criteria.minFeeRate.toString());

  // Optional parameters - only add if defined and not default values
  const optionalParams: Array<{
    key: string;
    value: number | boolean | undefined;
    shouldInclude?: (val: number | boolean) => boolean;
  }> = [
    { key: 'maxSize', value: criteria.maxSize },
    { key: 'minBaseFee', value: criteria.minBaseFee },
    { key: 'maxAncestorCount', value: criteria.maxAncestorCount },
    { key: 'maxDescendantCount', value: criteria.maxDescendantCount },
    {
      key: 'excludeBip125Replaceable',
      value: criteria.excludeBip125Replaceable
    },
    { key: 'excludeUnbroadcast', value: criteria.excludeUnbroadcast },
    { key: 'maxTransactionCount', value: criteria.maxTransactionCount }
  ];

  optionalParams.forEach(({ key, value, shouldInclude }) => {
    if (value !== undefined && (shouldInclude ? shouldInclude(value) : true)) {
      params.append(key, value.toString());
    }
  });

  return params;
}

/**
 * Handles the auto-selection process with proper error handling and user feedback
 */
async function processAutoSelection(
  criteria: AutoSelectionCriteria,
  transactions: MempoolTransaction[],
  selectedTxids: string[],
  currentTemplateId: number | null,
  settings: AppSettings,
  callbacks: {
    onSelectTransactions: (txids: string[]) => void;
    onToggleFetching?: () => void;
    onDeclareJob?: (txids: string[]) => Promise<boolean>;
  },
  isFetching: boolean
): Promise<void> {
  try {
    const params = buildAutoSelectionParams(criteria);
    const url = `http://localhost:3001/api/auto-select?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(
        `Auto-select API error: ${response.status} ${response.statusText}`
      );
    }

    const result: ApiResponse<MempoolTransaction[]> = await response.json();

    if (!result.success || !result.data || !Array.isArray(result.data)) {
      throw new Error('Invalid API response format');
    }

    await handleSelectionResult(
      result.data,
      transactions,
      selectedTxids,
      currentTemplateId,
      settings,
      callbacks,
      isFetching,
      false // isFailover
    );
  } catch (error) {
    console.error(
      'Auto-selection API failed, falling back to local filtering:',
      error
    );

    if (settings.general.showNotifications) {
      toast.warning('Using local filtering', {
        description: 'API unavailable, using local transaction filtering',
        duration: 3000
      });
    }

    // Fallback to local filtering
    const matchingTransactions = AutoSelectionService.filterTransactions(
      transactions,
      criteria
    );

    await handleSelectionResult(
      matchingTransactions,
      transactions,
      selectedTxids,
      currentTemplateId,
      settings,
      callbacks,
      isFetching,
      true // isFailover
    );
  }
}

/**
 * Handles the selection result whether from API or local filtering
 */
async function handleSelectionResult(
  matchingTransactions: MempoolTransaction[],
  allTransactions: MempoolTransaction[],
  selectedTxids: string[],
  currentTemplateId: number | null,
  settings: AppSettings,
  callbacks: {
    onSelectTransactions: (txids: string[]) => void;
    onToggleFetching?: () => void;
    onDeclareJob?: (txids: string[]) => Promise<boolean>;
  },
  isFetching: boolean,
  isFailover: boolean
): Promise<void> {
  if (matchingTransactions.length === 0) {
    if (settings.general.showNotifications) {
      toast.info('No matching transactions', {
        description:
          'No transactions match the current auto-selection criteria',
        duration: 3000
      });
    }
    return;
  }

  // Filter for valid transaction IDs that exist in current mempool
  const currentTxids = new Set(allTransactions.map((tx) => tx.txid));
  const validTxids = matchingTransactions
    .map((tx) => tx.txid)
    .filter((txid) => currentTxids.has(txid));

  if (validTxids.length === 0) {
    if (settings.general.showNotifications) {
      toast.warning('No valid transactions', {
        description: 'Matching transactions are no longer in the mempool',
        duration: 3000
      });
    }
    return;
  }

  // Handle selection clearing if configured
  if (settings.autoSelection.onNewTemplate.clearExistingSelections) {
    callbacks.onSelectTransactions([]);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Allow UI to update
  }

  // Analyze selection changes
  const currentlySelectedTxids = new Set(selectedTxids);
  const newSelections = validTxids.filter(
    (txid) => !currentlySelectedTxids.has(txid)
  );
  const alreadySelected = validTxids.filter((txid) =>
    currentlySelectedTxids.has(txid)
  );

  // Pause fetching if configured
  if (
    settings.general.pauseOnSelection &&
    isFetching &&
    callbacks.onToggleFetching
  ) {
    callbacks.onToggleFetching();
  }

  // Apply selection
  callbacks.onSelectTransactions(validTxids);

  // Show user feedback
  if (settings.general.showNotifications) {
    const templateText =
      settings.autoSelection.onNewTemplate.requireTemplate && currentTemplateId
        ? ` for template ${currentTemplateId}`
        : '';

    const description = buildSelectionDescription(
      validTxids.length,
      newSelections.length,
      alreadySelected.length,
      settings.autoSelection.onNewTemplate.clearExistingSelections,
      templateText,
      isFailover
    );

    toast.success(`Auto-selection ${isFailover ? '(local)' : 'completed'}`, {
      description,
      duration: 5000
    });
  }

  // Handle auto-scroll
  if (settings.general.autoScrollToTable) {
    setTimeout(() => {
      const tableContainer = document.querySelector('.data-table-container');
      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Handle auto job declaration
  if (
    settings.autoSelection.onNewTemplate.autoJobDeclaration &&
    callbacks.onDeclareJob &&
    currentTemplateId &&
    validTxids.length > 0
  ) {
    await handleAutoJobDeclaration(
      validTxids,
      currentTemplateId,
      callbacks.onDeclareJob,
      settings.general.showNotifications,
      isFailover
    );
  }
}

/**
 * Builds a descriptive message for selection results
 */
function buildSelectionDescription(
  totalSelected: number,
  newSelections: number,
  alreadySelected: number,
  clearedExisting: boolean,
  templateText: string,
  isFailover: boolean
): string {
  const failoverText = isFailover ? ' using local criteria' : '';

  if (clearedExisting) {
    return `Selected ${totalSelected} transactions${templateText} (cleared previous selections)${failoverText}`;
  }

  if (newSelections > 0 && alreadySelected > 0) {
    return `Added ${newSelections} new transactions (${alreadySelected} already selected)${templateText}${failoverText}`;
  }

  if (newSelections > 0) {
    return `Selected ${newSelections} transactions${templateText}${failoverText}`;
  }

  return `All ${alreadySelected} matching transactions were already selected${templateText}${failoverText}`;
}

/**
 * Handles automatic job declaration after auto-selection
 */
async function handleAutoJobDeclaration(
  txids: string[],
  templateId: number,
  onDeclareJob: (txids: string[]) => Promise<boolean>,
  showNotifications: boolean,
  isFailover: boolean
): Promise<void> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 200)); // Allow selection to process

    const jobSuccess = await onDeclareJob(txids);

    if (jobSuccess && showNotifications) {
      toast.success(
        `Auto job declaration ${isFailover ? '(local)' : 'completed'}`,
        {
          description: `Successfully declared job with ${txids.length} transactions for template ${templateId}`,
          duration: 5000
        }
      );
    }
  } catch (error) {
    console.error('Auto job declaration failed:', error);

    if (showNotifications) {
      toast.error('Auto job declaration failed', {
        description: `Failed to automatically declare job${isFailover ? ' (local mode)' : ''}`,
        duration: 5000
      });
    }
  }
}

interface UseAutoSelectionProps {
  transactions: MempoolTransaction[];
  onSelectTransactions: (txids: string[]) => void;
  selectedTxids: string[];
  currentTemplateId: number | null;
  isFetching: boolean;
  onToggleFetching?: () => void;
  onDeclareJob?: (txids: string[]) => Promise<boolean>;
}

export function useAutoSelection({
  transactions,
  onSelectTransactions,
  selectedTxids,
  currentTemplateId,
  isFetching,
  onToggleFetching,
  onDeclareJob
}: UseAutoSelectionProps) {
  const { settings } = useSettings();
  const lastNewTemplateRef = useRef<number | null>(null);
  const isAutoSelectionRunningRef = useRef<boolean>(false);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAutoSelection = useCallback(async () => {
    if (!settings.autoSelection.onNewTemplate.enabled) {
      return;
    }

    // Check if template is required and available
    if (
      settings.autoSelection.onNewTemplate.requireTemplate &&
      !currentTemplateId
    ) {
      return;
    }

    // Avoid running multiple times for the same template (only when template is required)
    if (
      settings.autoSelection.onNewTemplate.requireTemplate &&
      lastNewTemplateRef.current === currentTemplateId
    ) {
      return;
    }

    // Prevent concurrent executions
    if (isAutoSelectionRunningRef.current) {
      return;
    }

    if (settings.autoSelection.onNewTemplate.requireTemplate) {
      lastNewTemplateRef.current = currentTemplateId;
    }
    isAutoSelectionRunningRef.current = true;

    try {
      await processAutoSelection(
        settings.autoSelection.onNewTemplate,
        transactions,
        selectedTxids,
        currentTemplateId,
        settings,
        {
          onSelectTransactions,
          onToggleFetching,
          onDeclareJob
        },
        isFetching
      );
    } finally {
      isAutoSelectionRunningRef.current = false;
    }
  }, [
    settings,
    currentTemplateId,
    transactions,
    onSelectTransactions,
    isFetching,
    onToggleFetching,
    onDeclareJob,
    selectedTxids
  ]);

  // Effect for new template auto-selection
  useEffect(() => {
    if (!settings.autoSelection.onNewTemplate.enabled) {
      return;
    }

    // If template is required, check for template availability and avoid running multiple times
    if (settings.autoSelection.onNewTemplate.requireTemplate) {
      if (
        !currentTemplateId ||
        lastNewTemplateRef.current === currentTemplateId
      ) {
        return;
      }
    }

    handleAutoSelection();
  }, [
    currentTemplateId,
    settings.autoSelection.onNewTemplate.enabled,
    settings.autoSelection.onNewTemplate.requireTemplate
  ]); // Only include primitive dependencies

  // Effect for periodic auto-selection
  useEffect(() => {
    // Clear any existing timer
    if (periodicTimerRef.current) {
      clearInterval(periodicTimerRef.current);
      periodicTimerRef.current = null;
    }

    // Only setup periodic auto-selection if enabled and not requiring templates (or template available)
    if (
      settings.autoSelection.onNewTemplate.enabled &&
      settings.autoSelection.onNewTemplate.periodicEnabled &&
      (!settings.autoSelection.onNewTemplate.requireTemplate ||
        currentTemplateId)
    ) {
      const intervalMs =
        (settings.autoSelection.onNewTemplate.periodicInterval || 30) * 1000;

      periodicTimerRef.current = setInterval(() => {
        // Skip if auto-selection is already running
        if (isAutoSelectionRunningRef.current) {
          return;
        }

        // Skip if template is required but not available
        if (
          settings.autoSelection.onNewTemplate.requireTemplate &&
          !currentTemplateId
        ) {
          return;
        }

        // Run auto-selection (bypass template change detection)
        const previousTemplate = lastNewTemplateRef.current;
        lastNewTemplateRef.current = null;

        handleAutoSelection().finally(() => {
          if (settings.autoSelection.onNewTemplate.requireTemplate) {
            lastNewTemplateRef.current = previousTemplate;
          }
        });
      }, intervalMs);
    }

    // Cleanup function
    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
        periodicTimerRef.current = null;
      }
    };
  }, [
    settings.autoSelection.onNewTemplate.enabled,
    settings.autoSelection.onNewTemplate.periodicEnabled,
    settings.autoSelection.onNewTemplate.periodicInterval,
    settings.autoSelection.onNewTemplate.requireTemplate,
    currentTemplateId,
    handleAutoSelection
  ]);

  // Manual auto-selection trigger (ignores template change)
  const handleManualAutoSelection = useCallback(async () => {
    if (!settings.autoSelection.onNewTemplate.enabled) {
      toast.error('Auto-selection disabled', {
        description: 'Please enable auto-selection in settings first',
        duration: 3000
      });
      return;
    }

    if (
      settings.autoSelection.onNewTemplate.requireTemplate &&
      !currentTemplateId
    ) {
      toast.error('No template available', {
        description:
          'Template is required for auto-selection. Wait for a new template to arrive or disable "Require Template" setting',
        duration: 3000
      });
      return;
    }

    // Prevent concurrent executions
    if (isAutoSelectionRunningRef.current) {
      toast.warning('Auto-selection in progress', {
        description: 'Please wait for the current auto-selection to complete',
        duration: 3000
      });
      return;
    }

    // Reset the template ref to allow manual trigger
    const previousTemplate = lastNewTemplateRef.current;
    lastNewTemplateRef.current = null;

    try {
      await handleAutoSelection();
    } finally {
      // Restore the previous template to avoid duplicate auto-selection
      if (settings.autoSelection.onNewTemplate.requireTemplate) {
        lastNewTemplateRef.current = previousTemplate;
      }
    }
  }, [
    settings.autoSelection.onNewTemplate.enabled,
    settings.autoSelection.onNewTemplate.requireTemplate,
    currentTemplateId,
    handleAutoSelection
  ]);

  // Get current matching summary for display
  const getMatchingSummary = useCallback(() => {
    return {
      onNewTemplate: AutoSelectionService.getMatchingSummary(
        transactions,
        settings.autoSelection.onNewTemplate
      )
    };
  }, [transactions, settings.autoSelection]);

  return {
    getMatchingSummary,
    triggerAutoSelection: handleAutoSelection,
    handleManualAutoSelection
  };
}
