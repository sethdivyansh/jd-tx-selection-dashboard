'use client';

import PageContainer from '@/components/layout/page-container';
import { JobHistoryTable } from './job-history-table';

export function JobHistory() {
  return (
    <PageContainer>
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Job Declaration History
            </h2>
            <p className='text-muted-foreground'>
              View your submitted job declarations
            </p>
          </div>
        </div>
        <JobHistoryTable />
      </div>
    </PageContainer>
  );
}
