export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  icon?: React.ComponentType<any>;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

interface Fee {
  base: number;
  modified: number;
  ancestor: number;
  descendant: number;
}

export interface MempoolTransaction {
  txid: string;
  vsize: number;
  weight: number | null;
  time: number;
  height: number;
  descendant_count: number;
  descendant_size: number;
  ancestor_count: number;
  ancestor_size: number;
  wtxid: String;
  fees: Fee;
  feeRate: number;
  depends: string[];
  spent_by: string[];
  bip125_replaceable: boolean;
  unbroadcast: boolean;
}

// Types to match the backend sequence events
interface SequenceEvent {
  event: 'A' | 'R' | 'C' | 'D';
}

export interface MempoolAddEvent extends SequenceEvent {
  event: 'A';
  sequence: number;
  transaction: MempoolTransaction;
}

export interface MempoolRemoveEvent extends SequenceEvent {
  event: 'R';
  sequence: number;
  txid: string;
}

export interface BlockConnectEvent extends SequenceEvent {
  event: 'C';
  block: {
    block_hash: string;
    height: number;
    txids: string[];
  };
}

export interface BlockDisconnectEvent extends SequenceEvent {
  event: 'D';
  block_hash: string;
  transactions: MempoolTransaction[];
}

export type SequenceEventType =
  | MempoolAddEvent
  | MempoolRemoveEvent
  | BlockConnectEvent
  | BlockDisconnectEvent;

export interface HealthStatus {
  status: string;
  timestamp: number;
}

export interface PoolInfo {
  address: string;
  latency: number;
}

export interface MinerStats {
  device_name: string;
  hashrate: number;
  accepted_shares: number;
  rejected_shares: number;
  current_difficulty: number;
}

export type MinerStatsMap = Record<number, MinerStats>;

export interface AggregateStats {
  total_connected_device: number;
  total_hashrate: number;
  total_accepted_shares: number;
  total_rejected_shares: number;
  aggregate_diff: number;
}

export interface SystemStats {
  cpu_usage: number; // in Percentage
  memory_usage: string;
}

// New Template Notification types for WebSocket
export interface NewTemplateNotification {
  event: string;
  message: string;
  template_id: number | -1; // -1 indicates no template available
  timestamp: number;
}

export interface JobDeclarationRequest {
  template_id: number;
  txids: string[];
}

export interface JobDeclarationData {
  template_id?: number;
  rejected_tx?: string[];
  channel_id?: number;
  req_id?: number;
  job_id?: number;
  mining_job_token?: string;
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T | null;
}

// Log entry type for the logs component
export interface LogEntry {
  event: string;
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARNING' | 'ERROR';
  message: string;
}

// Auto-selection criteria types
export type SelectionStrategy =
  | 'maximizeFees'
  | 'maximizeCount'
  | 'balanced'
  | 'compact'
  | 'maxCapacity'
  | 'prioritizeSmallTransactions'; // Keep backward compatibility

export interface AutoSelectionCriteria {
  enabled: boolean;
  selectionStrategy: SelectionStrategy;
  minFeeRate: number;
  maxSize: number;
  minBaseFee: number;
  maxAncestorCount: number;
  maxDescendantCount: number;
  excludeBip125Replaceable: boolean;
  excludeUnbroadcast: boolean;
  maxTransactionCount: number;
  requireTemplate: boolean; // Whether auto-selection requires a template
  clearExistingSelections: boolean; // Whether to clear existing selections when auto-selection runs
  periodicEnabled: boolean; // Whether to run auto-selection periodically
  periodicInterval: number; // Interval in seconds for periodic auto-selection
  autoJobDeclaration: boolean; // Whether to automatically declare jobs after auto-selection
}

export interface AppSettings {
  autoSelection: {
    onNewTemplate: AutoSelectionCriteria;
  };
  general: {
    autoScrollToTable: boolean;
    showNotifications: boolean;
    pauseOnSelection: boolean;
    clearSelectionOnJobDeclaration: boolean;
    autoCleanInvalidTransactions: boolean;
  };
}

export interface ApiSettings {
  id: number;
  created_at: string;
  updated_at: string;
  // Auto-selection settings
  auto_selection_enabled: boolean;
  selection_strategy: string;
  min_fee_rate: number;
  max_size: number;
  min_base_fee: number;
  max_ancestor_count: number;
  max_descendant_count: number;
  exclude_bip125_replaceable: boolean;
  exclude_unbroadcast: boolean;
  max_transaction_count: number;
  require_template: boolean;
  clear_existing_selections: boolean;
  periodic_enabled: boolean;
  periodic_interval: number;
  auto_job_declaration: boolean;
  // General settings
  auto_scroll_to_table: boolean;
  show_notifications: boolean;
  pause_on_selection: boolean;
  clear_selection_on_job_declaration: boolean;
  auto_clean_invalid_transactions: boolean;
}

// Partial update type for API
export type ApiSettingsUpdate = Partial<
  Omit<ApiSettings, 'id' | 'created_at' | 'updated_at'>
>;
