'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface JobHistoryErrorProps {
  error: Error;
  reset: () => void;
}

export default function JobHistoryError({
  error,
  reset
}: JobHistoryErrorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const reload = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <Card className='border-red-500'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Alert variant='destructive' className='border-none'>
            <IconAlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className='mt-2'>
              Failed to load job history:{' '}
              {error.message || 'An unexpected error occurred.'}
            </AlertDescription>
          </Alert>
        </div>
      </CardHeader>
      <CardContent className='flex h-[316px] items-center justify-center p-6'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>
            Unable to display job history at this time
          </p>
          <Button
            onClick={() => reload()}
            variant='outline'
            className='min-w-[120px]'
            disabled={isPending}
          >
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
