'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Settings, Zap, Play, Send } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import type { MempoolTransaction } from '@/types/index';
import { AutoSelectionSettingsForm } from '@/components/settings/auto-selection/auto-selection-settings-form';

interface AutoSelectionControlsProps {
  transactions: MempoolTransaction[];
  currentTemplateId: number | null;
  onSelectTransactions: (txids: string[]) => void;
  selectedTxids: string[];
  isFetching: boolean;
  onToggleFetching?: () => void;
  onManualAutoSelection: () => Promise<void>;
}

export function AutoSelectionControls({
  currentTemplateId,
  onManualAutoSelection
}: AutoSelectionControlsProps) {
  const { settings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const autoSelectionEnabled = settings.autoSelection.onNewTemplate.enabled;
  const requiresTemplate = settings.autoSelection.onNewTemplate.requireTemplate;
  const periodicEnabled = settings.autoSelection.onNewTemplate.periodicEnabled;
  const autoJobDeclaration =
    settings.autoSelection.onNewTemplate.autoJobDeclaration;
  const canRunManualSelection =
    autoSelectionEnabled && (!requiresTemplate || currentTemplateId);

  return (
    <div className='mb-4 flex flex-wrap items-center gap-2'>
      {autoSelectionEnabled && (
        <Badge variant='outline' className='flex items-center gap-1'>
          {requiresTemplate ? 'Template Required' : 'No Template Required'}
        </Badge>
      )}

      {autoSelectionEnabled && periodicEnabled && (
        <Badge variant='outline' className='flex items-center gap-1'>
          <Zap className='h-3 w-3' />
          Periodic: {settings.autoSelection.onNewTemplate.periodicInterval}s
        </Badge>
      )}

      {autoSelectionEnabled && autoJobDeclaration && (
        <Badge variant='outline' className='flex items-center gap-1'>
          <Send className='h-3 w-3' />
          Auto Job Declaration
        </Badge>
      )}
      <Button
        variant='outline'
        size='sm'
        onClick={onManualAutoSelection}
        disabled={!canRunManualSelection}
        className='flex items-center gap-2'
        title={
          !autoSelectionEnabled
            ? 'Auto-selection is disabled'
            : requiresTemplate && !currentTemplateId
              ? 'Template required but not available'
              : 'Run auto-selection now'
        }
      >
        <Play className='h-3 w-3' />
        Run Auto-Selection
      </Button>

      <Button
        variant='outline'
        size='sm'
        className='flex items-center gap-2'
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings className='h-3 w-3' />
        Settings
      </Button>

      <Modal
        title='Auto-Selection Settings'
        description='Configure auto-selection criteria for transaction selection when new templates arrive.'
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        size='5xl'
      >
        <AutoSelectionSettingsForm onClose={() => setIsSettingsOpen(false)} />
      </Modal>
    </div>
  );
}
