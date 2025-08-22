import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface ValidationStatusProps {
  validationState: {
    isValid: boolean;
    totalWeight: number;
    weightUtilization: number;
    dependencyIssues: number;
    canAddMore: boolean;
    remainingCapacity: number;
  };
  selectionSummary: string;
  selectedCount: number;
}

export function ValidationStatus({
  validationState,
  selectionSummary,
  selectedCount
}: ValidationStatusProps) {
  const getStatusIcon = () => {
    if (!validationState.isValid) {
      return <AlertTriangle className='h-4 w-4 text-red-500' />;
    }
    return <CheckCircle className='h-4 w-4 text-green-500' />;
  };

  const getStatusBadge = () => {
    if (!validationState.isValid) {
      return <Badge variant='destructive'>Invalid Selection</Badge>;
    }
    return <Badge variant='default'>Valid Selection</Badge>;
  };

  const weightPercent = Math.min(validationState.weightUtilization, 100);

  return (
    <Card className='mb-2 gap-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {getStatusIcon()}
          <span className='font-medium'>Bitcoin Mining Validation</span>
        </div>
        {getStatusBadge()}
      </div>

      <div className='text-muted-foreground text-sm'>{selectionSummary}</div>

      {
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span>Block Weight Usage:</span>
            <span
              className={cn(
                'font-medium',
                weightPercent > 100
                  ? 'text-red-500'
                  : weightPercent > 90
                    ? 'text-orange-500'
                    : 'text-green-600'
              )}
            >
              {weightPercent.toFixed(1)}%
            </span>
          </div>

          <Progress
            value={Math.min(weightPercent, 100)}
            className={cn('h-2', weightPercent > 100 && 'bg-red-100')}
          />

          <div className='text-muted-foreground flex justify-between text-xs'>
            <span>
              {validationState.totalWeight.toLocaleString()} / 4,000,000 weight
              units
            </span>
            <span>
              {validationState.remainingCapacity > 0
                ? `${validationState.remainingCapacity.toLocaleString()} remaining`
                : 'Limit exceeded'}
            </span>
          </div>

          {validationState.dependencyIssues > 0 && (
            <div className='flex items-center gap-1 text-xs text-orange-600'>
              <AlertTriangle className='h-3 w-3' />
              <span>
                {validationState.dependencyIssues} dependency issue(s)
              </span>
            </div>
          )}
        </div>
      }
    </Card>
  );
}
