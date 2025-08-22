import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { MempoolTransaction } from '@/types/index';
import { cn } from '@/lib/utils';

interface TransactionCheckboxProps {
  transaction: MempoolTransaction;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  canSelect?: boolean;
  validationMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function TransactionCheckbox({
  transaction,
  isSelected,
  onSelectionChange,
  canSelect = true,
  validationMessage = '',
  disabled = false,
  className
}: TransactionCheckboxProps) {
  const handleCheckedChange = (checked: boolean) => {
    // If trying to select and validation fails, don't allow selection
    if (checked && !canSelect && !isSelected) {
      return;
    }

    onSelectionChange(checked);
  };

  const getTooltipContent = () => {
    if (!canSelect && validationMessage) {
      return validationMessage;
    }

    return null;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1', className)}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckedChange}
              disabled={disabled || !canSelect}
              aria-label={`Select transaction ${transaction.txid.slice(0, 8)}...`}
            />
          </div>
        </TooltipTrigger>
        {!canSelect && validationMessage && (
          <TooltipContent side='right' className='max-w-xs'>
            <p className='text-sm'>{getTooltipContent()}</p>
            <div className='mt-1 flex items-center gap-1 text-xs text-orange-200'>
              <AlertTriangle className='h-3 w-3' />
              Validation failed
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
