import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { AutoSelectionService } from '@/lib/auto-selection';
import { Zap, Target } from 'lucide-react';
import type { MempoolTransaction } from '@/types/index';

interface AutoSelectionStatusProps {
  transactions: MempoolTransaction[];
  currentTemplateId: number | null;
}

export function AutoSelectionStatus({
  transactions,
  currentTemplateId
}: AutoSelectionStatusProps) {
  const { settings } = useSettings();

  const onNewTemplateSummary = React.useMemo(
    () =>
      AutoSelectionService.getMatchingSummary(
        transactions,
        settings.autoSelection.onNewTemplate
      ),
    [transactions, settings.autoSelection.onNewTemplate]
  );

  if (!settings.autoSelection.onNewTemplate.enabled) {
    return null;
  }

  return (
    <Card className='mb-4'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Zap className='h-4 w-4' />
          Auto-Selection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-2'>
          <Badge
            variant={currentTemplateId ? 'default' : 'secondary'}
            className='flex items-center gap-1'
          >
            <Target className='h-3 w-3' />
            New Template: {onNewTemplateSummary.willSelect}/
            {onNewTemplateSummary.total}
            {currentTemplateId
              ? ` (Template ${currentTemplateId})`
              : ' (Waiting)'}
          </Badge>
        </div>

        <div className='text-muted-foreground mt-2 text-sm'>
          {onNewTemplateSummary.matching > 0
            ? `${onNewTemplateSummary.matching} transactions match current criteria`
            : 'No transactions currently match the criteria'}
        </div>
      </CardContent>
    </Card>
  );
}
