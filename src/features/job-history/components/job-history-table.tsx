'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useJobHistory, JobHistoryItem } from '@/hooks/use-job-history';
import { jobHistoryColumns } from './job-history-columns';
import { JobTxidsModal } from '@/components/modal/job-txids-modal';
import { ServerSidePagination } from '@/components/ui/server-side-pagination';
import { RefreshCw } from 'lucide-react';
import { flexRender } from '@tanstack/react-table';

interface JobHistoryTableProps {
  page?: number;
  perPage?: number;
}

export function JobHistoryTable({
  page = 1,
  perPage = 10
}: JobHistoryTableProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [isTxidsModalOpen, setIsTxidsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageSize, setPageSize] = useState(perPage);

  const { data, loading, error, refetch } = useJobHistory({
    page: currentPage,
    per_page: pageSize
  });

  const jobs = data?.data?.jobs || [];
  const totalPages = data?.data?.total_pages || 0;
  const totalItems = data?.data?.total || 0;

  const { table } = useDataTable<JobHistoryItem>({
    data: jobs,
    columns: jobHistoryColumns,
    getRowId: (row) => row.id.toString(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: jobs.length || pageSize // Use actual data length
      }
    }
  });

  // Disable client-side pagination since we're doing server-side
  useEffect(() => {
    table.setPageSize(jobs.length || pageSize);
    table.setPageIndex(0);
  }, [jobs, pageSize, table]);

  // Handle custom event for viewing job txids
  useEffect(() => {
    const handleViewJobTxids = (event: CustomEvent) => {
      const { templateId } = event.detail;
      setSelectedTemplateId(templateId);
      setIsTxidsModalOpen(true);
    };

    window.addEventListener(
      'view-job-txids',
      handleViewJobTxids as EventListener
    );
    return () => {
      window.removeEventListener(
        'view-job-txids',
        handleViewJobTxids as EventListener
      );
    };
  }, []);

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <Card className='p-6'>
        <div className='space-y-4 text-center'>
          <div className='text-destructive'>
            Error loading job history: {error}
          </div>
          <Button onClick={handleRefresh} variant='outline'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className='px-4'>
          <div className='flex items-center justify-between gap-2 py-4'>
            <div className='flex items-center gap-2'>
              <DataTableToolbar table={table} />
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
            <div className='text-muted-foreground text-sm'>
              {loading
                ? 'Loading...'
                : `${totalItems} total job${totalItems !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Custom table without DataTable wrapper */}
          <div className='overflow-hidden rounded-md border'>
            <table className='w-full caption-bottom text-sm'>
              <thead className='[&_tr]:border-b'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className='hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className='text-muted-foreground h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0'
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className='[&_tr:last-child]:border-0'>
                {jobs.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={table.getAllColumns().length}
                      className='h-24 text-center'
                    >
                      No results.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className='hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className='p-4 align-middle [&:has([role=checkbox])]:pr-0'
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
                {loading && (
                  <tr className='bg-background/70 absolute inset-0'>
                    <td
                      colSpan={table.getAllColumns().length}
                      className='h-24 text-center'
                    >
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Server-side pagination */}
          <div className='mt-4'>
            <ServerSidePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1); // Reset to first page
              }}
              loading={loading}
            />
          </div>
        </div>
      </Card>

      <JobTxidsModal
        isOpen={isTxidsModalOpen}
        onClose={() => setIsTxidsModalOpen(false)}
        templateId={selectedTemplateId}
      />
    </>
  );
}
