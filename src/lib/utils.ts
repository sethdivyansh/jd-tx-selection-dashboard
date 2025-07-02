import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MempoolTransaction } from '@/types/index';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseMempoolTransaction = (tx: any): MempoolTransaction => {
  return {
    txid: tx.txid,
    vsize: tx.vsize,
    weight: tx.weight,
    time: tx.time,
    height: tx.height,
    descendant_count: tx.descendant_count,
    descendant_size: tx.descendant_size,
    ancestor_count: tx.ancestor_count,
    ancestor_size: tx.ancestor_size,
    wtxid: tx.wtxid || tx.txid,
    fees: {
      base: tx.fees.base * 1e8,
      modified: tx.fees.modified * 1e8,
      ancestor: tx.fees.ancestor * 1e8,
      descendant: tx.fees.descendant * 1e8
    },
    feeRate: (tx.fees.base * 1e8) / tx.vsize,
    depends: tx.depends || [],
    spent_by: tx.spent_by || [],
    bip125_replaceable: tx.bip125_replaceable,
    unbroadcast: tx.unbroadcast
  };
};

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

export function formatDateTime(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      hour: opts.hour ?? 'numeric',
      minute: opts.minute ?? '2-digit',
      second: opts.second,
      hour12: opts.hour12 ?? true,
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}

export function formatHashrate(hashrate: number, decimals: number = 2) {
  if (hashrate >= 1000000000000) {
    return `${(hashrate / 1000000000000).toFixed(decimals)} TH/s`;
  } else if (hashrate >= 1000000000) {
    return `${(hashrate / 1000000000).toFixed(decimals)} GH/s`;
  } else if (hashrate >= 1000000) {
    return `${(hashrate / 1000000).toFixed(decimals)} MH/s`;
  }
  return `${hashrate.toFixed(decimals)} H/s`;
}

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
}

// Exports transaction data to CSV format and triggers download
export async function exportTransactionsToCSV(
  transactions: MempoolTransaction[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`,
    includeHeaders = true
  } = options;

  try {
    const csvContent = generateTransactionCSV(transactions, includeHeaders);
    await downloadCSV(csvContent, filename);
  } catch (error) {
    throw new Error('Export failed');
  }
}

// Generates CSV content from transaction data
export function generateTransactionCSV(
  transactions: MempoolTransaction[],
  includeHeaders: boolean = true
): string {
  const headers = ['Transaction ID', 'Fee Rate', 'Base Fee', 'Size', 'Time'];

  const rows = transactions.map((tx) => [
    tx.txid,
    `${tx.feeRate} sat/vB`,
    `${tx.fees.base} sat`,
    `${tx.vsize} vB`,
    formatDateTime(tx.time)
  ]);

  const csvRows = includeHeaders ? [headers, ...rows] : rows;

  return csvRows
    .map((row) => row.map((field) => `"${field}"`).join(','))
    .join('\n');
}

// Triggers CSV file download in the browser
export async function downloadCSV(
  content: string,
  filename: string
): Promise<void> {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function copyTransactionIds(
  transactions: MempoolTransaction[]
): Promise<void> {
  const txids = transactions.map((tx) => tx.txid).join('\n');

  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  await navigator.clipboard.writeText(txids);
}
