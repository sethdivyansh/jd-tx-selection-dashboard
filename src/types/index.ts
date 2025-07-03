export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
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
  depends: String[];
  spent_by: String[];
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
