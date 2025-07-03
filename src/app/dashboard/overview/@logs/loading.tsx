import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardTitle } from '@/components/ui/card';

export default function Loading() {
  return (
    <Card className='mx-auto max-h-[400px] w-full rounded-2xl border p-6 shadow-md'>
      <CardTitle className='mb-4 text-lg font-semibold'>Logs</CardTitle>
      <Separator />
      {[...Array(2)].map((_, idx) => (
        <div className='mb-6' key={`skeleton-${idx}`}>
          <div className='mb-2 flex items-center justify-between'>
            <Skeleton className='h-6 w-20 rounded-full' />
            <Skeleton className='h-4 w-28 rounded' />
          </div>
          <Skeleton className='mb-2 h-4 w-full rounded' />
          <Skeleton className='h-4 w-3/5 rounded' />
          {idx < 4 && <Separator className='my-4' />}
        </div>
      ))}
    </Card>
  );
}
