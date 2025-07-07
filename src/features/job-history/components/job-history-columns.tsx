'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { JobHistoryItem } from '@/hooks/use-job-history';
import { formatDateTime } from '@/lib/utils';
import { Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const jobHistoryColumns: ColumnDef<JobHistoryItem>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='JD No' />
    ),
    cell: ({ row }) => <div className='font-medium'>#{row.getValue('id')}</div>
  },
  {
    accessorKey: 'template_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Template ID' />
    ),
    cell: ({ row }) => (
      <div className='font-mono text-sm'>{row.getValue('template_id')}</div>
    )
  },
  {
    accessorKey: 'channel_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Channel' />
    ),
    cell: ({ row }) => (
      <Badge variant='secondary'>CH-{row.getValue('channel_id')}</Badge>
    )
  },
  {
    accessorKey: 'txid_count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='TX Count' />
    ),
    cell: ({ row }) => (
      <div className='text-center font-medium'>
        {row.getValue('txid_count')}
      </div>
    )
  },
  {
    accessorKey: 'mining_job_token',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Mining Job Token Hex' />
    ),
    cell: ({ row }) => {
      const token = row.getValue('mining_job_token') as string;
      const shortToken = `${token.slice(0, 8)}...${token.slice(-8)}`;

      return (
        <div className='flex items-center gap-2'>
          <code className='bg-muted rounded px-2 py-1 font-mono text-sm'>
            {shortToken}
          </code>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              navigator.clipboard.writeText(token);
              toast.success('Mining Job Token Hex copied to clipboard');
            }}
          >
            <Copy className='h-3 w-3' />
          </Button>
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground text-sm'>
        {formatDateTime(row.getValue('created_at'))}
      </div>
    )
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const job = row.original;

      return (
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              // This will trigger the txids modal
              // We'll handle this in the parent component
              window.dispatchEvent(
                new CustomEvent('view-job-txids', {
                  detail: { templateId: job.template_id }
                })
              );
            }}
          >
            <Eye className='h-3 w-3' />
            View TXIDs
          </Button>
        </div>
      );
    }
  }
];
