'use client';

import type { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table
}: DataTableViewOptionsProps<TData>) {
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== 'undefined' && column.getCanHide()
        ),
    [table]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label='Toggle columns'
          role='combobox'
          variant='outline'
          size='sm'
          className='ml-auto hidden h-8 lg:flex'
        >
          <Settings2 />
          View
          <CaretSortIcon className='ml-auto opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-44 p-2'>
        <div className='space-y-1'>
          {columns.map((column) => (
        <div
          key={column.id}
          className='flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer'
          onClick={() => column.toggleVisibility(!column.getIsVisible())}
        >
          <span className='truncate text-sm'>
            {column.columnDef.meta?.label ?? column.id}
          </span>
          <CheckIcon
            className={cn(
          'ml-2 size-4 shrink-0',
          column.getIsVisible() ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
          ))}
        </div>
      </PopoverContent>
        </Popover>
      );
    }
