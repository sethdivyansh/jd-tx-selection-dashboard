import { Card } from '@/components/ui/card';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function JobHistoryLoading() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <div className='bg-muted h-8 w-64 animate-pulse rounded-md' />
          <div className='bg-muted h-4 w-80 animate-pulse rounded-md' />
        </div>
      </div>
      <Card className='h-full px-2'>
        <DataTableSkeleton columnCount={7} rowCount={8} />
      </Card>
    </div>
  );
}
