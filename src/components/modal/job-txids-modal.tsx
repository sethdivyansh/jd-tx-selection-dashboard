'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useJobTxids } from '@/hooks/use-job-history';
import { Copy, Download, Hash, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { copyTxidsList, downloadCSV } from '@/lib/utils';

// Component for individual txid row with tooltip and actions
const TxidRow: React.FC<{ txid: string; index: number }> = ({
  txid,
  index
}) => {
  const copyTxid = async () => {
    await navigator.clipboard.writeText(txid);
    toast.success('TXID copied to clipboard');
  };

  const handleExternalLink = () => {
    window.open(
      `https://mempool.space/tx/${txid}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='hover:bg-muted group flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors'>
            <div className='flex items-center gap-2' onClick={copyTxid}>
              <Badge variant='secondary' className='text-xs'>
                {index + 1}
              </Badge>
              <code className='bg-muted rounded px-2 py-1 font-mono text-sm transition-colors hover:text-blue-600'>
                {txid}
              </code>
            </div>
            <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
              <Button
                variant='ghost'
                size='sm'
                onClick={copyTxid}
                className='h-6 w-6 p-0'
                title='Copy transaction ID'
              >
                <Copy className='h-3 w-3' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleExternalLink}
                className='h-6 w-6 p-0'
                title='View on mempool.space'
              >
                <ExternalLink className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side='left' className='max-w-xs break-all'>
          <div className='space-y-1 text-xs'>
            <div>
              <strong>Transaction ID #{index + 1}</strong>
            </div>
            <div className='font-mono'>{txid}</div>
            <div className='mt-2 text-xs text-gray-400'>
              Click to copy • Use icons for actions
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface JobTxidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: number | null;
}

export function JobTxidsModal({
  isOpen,
  onClose,
  templateId
}: JobTxidsModalProps) {
  const { data, loading, error } = useJobTxids(templateId);

  const copyAllTxids = async () => {
    if (data?.data.txids) {
      await copyTxidsList(data.data.txids);
      toast.success(`${data.data.txids.length} TXIDs copied to clipboard`);
    }
  };

  const exportToCSV = async () => {
    if (data?.data.txids) {
      const csvContent = ['txid', ...data.data.txids].join('\n');
      await downloadCSV(csvContent, `job-txids-${templateId}.csv`);
      toast.success('TXIDs exported to CSV');
    }
  };

  return (
    <Modal
      title={`Job TXIDs - Template ${templateId}`}
      description='Transaction IDs included in this job declaration'
      isOpen={isOpen}
      onClose={onClose}
      size='3xl'
    >
      <div className='space-y-4'>
        {loading && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-muted-foreground'>
              Loading transaction IDs...
            </div>
          </div>
        )}

        {error && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-destructive'>Error: {error}</div>
          </div>
        )}

        {data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Hash className='h-4 w-4' />
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Template ID
                    </div>
                    <div className='font-medium'>{data.data.template_id}</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Total TXIDs
                    </div>
                    <div className='font-medium'>{data.data.total}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='flex items-center justify-between'>
              <Badge variant='outline' className='text-sm'>
                {data.data.total} Transaction{data.data.total !== 1 ? 's' : ''}
              </Badge>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={copyAllTxids}
                  className='flex items-center gap-2'
                >
                  <Copy className='h-3 w-3' />
                  Copy All
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={exportToCSV}
                  className='flex items-center gap-2'
                >
                  <Download className='h-3 w-3' />
                  Export CSV
                </Button>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <h4 className='font-medium'>Transaction IDs</h4>
              <ScrollArea className='h-96 w-full rounded-md border'>
                <div className='space-y-2 p-4'>
                  {data.data.txids.map((txid, index) => (
                    <TxidRow key={txid} txid={txid} index={index} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
