import type {
  AppSettings,
  ApiSettings,
  ApiSettingsUpdate,
  SelectionStrategy
} from '@/types/index';

// Strategy mapping
const STRATEGY_TO_API: Record<SelectionStrategy, string> = {
  maximizeFees: 'maximizeFees',
  maximizeCount: 'maximize_count',
  balanced: 'balanced'
};

const STRATEGY_FROM_API: Record<string, SelectionStrategy> = {
  maximizeFees: 'maximizeFees',
  maximize_count: 'maximizeCount',
  balanced: 'balanced'
};

const mapStrategyToApi = (strategy: SelectionStrategy): string => {
  return STRATEGY_TO_API[strategy] ?? 'maximizeFees';
};

const mapStrategyFromApi = (strategy: string): SelectionStrategy => {
  return STRATEGY_FROM_API[strategy] ?? 'maximizeFees';
};

export const transformApiToAppSettings = (
  apiSettings: ApiSettings
): AppSettings => {
  return {
    autoSelection: {
      onNewTemplate: {
        enabled: apiSettings.auto_selection_enabled,
        selectionStrategy: mapStrategyFromApi(apiSettings.selection_strategy),
        minFeeRate: apiSettings.min_fee_rate,
        maxSize: apiSettings.max_size,
        minBaseFee: apiSettings.min_base_fee,
        maxAncestorCount: apiSettings.max_ancestor_count,
        maxDescendantCount: apiSettings.max_descendant_count,
        excludeBip125Replaceable: apiSettings.exclude_bip125_replaceable,
        excludeUnbroadcast: apiSettings.exclude_unbroadcast,
        maxTransactionCount: apiSettings.max_transaction_count,
        requireTemplate: apiSettings.require_template,
        clearExistingSelections: apiSettings.clear_existing_selections,
        periodicEnabled: apiSettings.periodic_enabled,
        periodicInterval: apiSettings.periodic_interval,
        autoJobDeclaration: apiSettings.auto_job_declaration
      }
    },
    general: {
      autoScrollToTable: apiSettings.auto_scroll_to_table,
      showNotifications: apiSettings.show_notifications,
      pauseOnSelection: apiSettings.pause_on_selection,
      clearSelectionOnJobDeclaration:
        apiSettings.clear_selection_on_job_declaration,
      autoCleanInvalidTransactions: apiSettings.auto_clean_invalid_transactions
    }
  };
};

export const transformAppToApiSettings = (
  appSettings: AppSettings
): ApiSettingsUpdate => {
  return {
    // Auto-selection settings
    auto_selection_enabled: appSettings.autoSelection.onNewTemplate.enabled,
    selection_strategy: mapStrategyToApi(
      appSettings.autoSelection.onNewTemplate.selectionStrategy
    ),
    min_fee_rate: appSettings.autoSelection.onNewTemplate.minFeeRate,
    max_size: appSettings.autoSelection.onNewTemplate.maxSize,
    min_base_fee: appSettings.autoSelection.onNewTemplate.minBaseFee,
    max_ancestor_count:
      appSettings.autoSelection.onNewTemplate.maxAncestorCount,
    max_descendant_count:
      appSettings.autoSelection.onNewTemplate.maxDescendantCount,
    exclude_bip125_replaceable:
      appSettings.autoSelection.onNewTemplate.excludeBip125Replaceable,
    exclude_unbroadcast:
      appSettings.autoSelection.onNewTemplate.excludeUnbroadcast,
    max_transaction_count:
      appSettings.autoSelection.onNewTemplate.maxTransactionCount,
    require_template: appSettings.autoSelection.onNewTemplate.requireTemplate,
    clear_existing_selections:
      appSettings.autoSelection.onNewTemplate.clearExistingSelections,
    periodic_enabled: appSettings.autoSelection.onNewTemplate.periodicEnabled,
    periodic_interval: appSettings.autoSelection.onNewTemplate.periodicInterval,
    auto_job_declaration:
      appSettings.autoSelection.onNewTemplate.autoJobDeclaration,

    // General settings
    auto_scroll_to_table: appSettings.general.autoScrollToTable,
    show_notifications: appSettings.general.showNotifications,
    pause_on_selection: appSettings.general.pauseOnSelection,
    clear_selection_on_job_declaration:
      appSettings.general.clearSelectionOnJobDeclaration,
    auto_clean_invalid_transactions:
      appSettings.general.autoCleanInvalidTransactions
  };
};

// Transform partial frontend settings to API update format
export const transformPartialAppToApiSettings = (
  partialAppSettings: Partial<AppSettings>
): ApiSettingsUpdate => {
  const apiUpdate: ApiSettingsUpdate = {};

  // Handle auto-selection settings
  if (partialAppSettings.autoSelection?.onNewTemplate) {
    const autoSel = partialAppSettings.autoSelection.onNewTemplate;
    if (autoSel.enabled !== undefined)
      apiUpdate.auto_selection_enabled = autoSel.enabled;
    if (autoSel.selectionStrategy !== undefined)
      apiUpdate.selection_strategy = mapStrategyToApi(
        autoSel.selectionStrategy
      );
    if (autoSel.minFeeRate !== undefined)
      apiUpdate.min_fee_rate = autoSel.minFeeRate;
    if (autoSel.maxSize !== undefined) apiUpdate.max_size = autoSel.maxSize;
    if (autoSel.minBaseFee !== undefined)
      apiUpdate.min_base_fee = autoSel.minBaseFee;
    if (autoSel.maxAncestorCount !== undefined)
      apiUpdate.max_ancestor_count = autoSel.maxAncestorCount;
    if (autoSel.maxDescendantCount !== undefined)
      apiUpdate.max_descendant_count = autoSel.maxDescendantCount;
    if (autoSel.excludeBip125Replaceable !== undefined)
      apiUpdate.exclude_bip125_replaceable = autoSel.excludeBip125Replaceable;
    if (autoSel.excludeUnbroadcast !== undefined)
      apiUpdate.exclude_unbroadcast = autoSel.excludeUnbroadcast;
    if (autoSel.maxTransactionCount !== undefined)
      apiUpdate.max_transaction_count = autoSel.maxTransactionCount;
    if (autoSel.requireTemplate !== undefined)
      apiUpdate.require_template = autoSel.requireTemplate;
    if (autoSel.clearExistingSelections !== undefined)
      apiUpdate.clear_existing_selections = autoSel.clearExistingSelections;
    if (autoSel.periodicEnabled !== undefined)
      apiUpdate.periodic_enabled = autoSel.periodicEnabled;
    if (autoSel.periodicInterval !== undefined)
      apiUpdate.periodic_interval = autoSel.periodicInterval;
    if (autoSel.autoJobDeclaration !== undefined)
      apiUpdate.auto_job_declaration = autoSel.autoJobDeclaration;
  }

  // Handle general settings
  if (partialAppSettings.general) {
    const general = partialAppSettings.general;
    if (general.autoScrollToTable !== undefined)
      apiUpdate.auto_scroll_to_table = general.autoScrollToTable;
    if (general.showNotifications !== undefined)
      apiUpdate.show_notifications = general.showNotifications;
    if (general.pauseOnSelection !== undefined)
      apiUpdate.pause_on_selection = general.pauseOnSelection;
    if (general.clearSelectionOnJobDeclaration !== undefined)
      apiUpdate.clear_selection_on_job_declaration =
        general.clearSelectionOnJobDeclaration;
    if (general.autoCleanInvalidTransactions !== undefined)
      apiUpdate.auto_clean_invalid_transactions =
        general.autoCleanInvalidTransactions;
  }

  return apiUpdate;
};
