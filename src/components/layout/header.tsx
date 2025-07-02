import React from 'react';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { ThemeSelector } from '../theme-selector';
import { Separator } from '../ui/separator';

export default function Header() {
  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <Separator orientation='vertical' className='mr-2 h-4' />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <ModeToggle />
        <ThemeSelector />
      </div>
    </header>
  );
}
