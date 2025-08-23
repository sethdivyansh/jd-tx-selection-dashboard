'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  useAutoSelectionSettings,
  useSettings
} from '@/contexts/SettingsContext';
import type { AutoSelectionCriteria, SelectionStrategy } from '@/types/index';

const SELECTION_STRATEGIES: {
  value: SelectionStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: 'maximizeFees',
    label: 'Maximize Fees',
    description: 'Select transactions to maximize total fees (default)'
  },
  {
    value: 'maximizeCount',
    label: 'Maximize Count',
    description: 'Select maximum number of transactions'
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Balanced approach between fees and count'
  }
];

interface AutoSelectionSettingsFormProps {
  onClose?: () => void;
}

export function AutoSelectionSettingsForm({
  onClose
}: AutoSelectionSettingsFormProps) {
  const { autoSelection, updateAutoSelection } = useAutoSelectionSettings();
  const { saveSettings, isSaving } = useSettings();
  const criteria = autoSelection.onNewTemplate;

  // Update local settings (not saved to API until save button is clicked)
  const updateCriteria = (updates: Partial<AutoSelectionCriteria>) => {
    updateAutoSelection({
      onNewTemplate: {
        ...criteria,
        ...updates
      }
    });
  };

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch (error) {
      // Error handling is done in the context
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className='space-y-6 px-1'>
      <div className='flex items-center justify-between'>
        <div>
          <Label className='text-base font-medium'>Enable Auto-Selection</Label>
          <p className='text-muted-foreground text-sm'>
            Automatically select transactions when new templates arrive
          </p>
        </div>
        <Switch
          checked={criteria.enabled}
          onCheckedChange={(enabled: boolean) => updateCriteria({ enabled })}
        />
      </div>

      {
        <>
          <Separator />

          {/* Selection Strategy */}
          <div className='flex items-end justify-between gap-4'>
            <div className='flex-1 space-y-2'>
              <Label className='text-lg'>Selection Strategy</Label>
              <Select
                value={criteria.selectionStrategy}
                onValueChange={(value: SelectionStrategy) =>
                  updateCriteria({ selectionStrategy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select strategy' />
                </SelectTrigger>
                <SelectContent>
                  {SELECTION_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value}>
                      <div className='flex flex-col'>
                        <div className='font-medium'>{strategy.label}</div>
                        <div className='text-muted-foreground text-xs'>
                          {strategy.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex gap-2 pb-1'>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant='default'
                size='sm'
                className='min-w-[100px]'
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          {/* Main Criteria */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='min-fee-rate'>Min Fee Rate (sat/vB)</Label>
              <Input
                id='min-fee-rate'
                type='number'
                value={criteria.minFeeRate || ''}
                onChange={(e) =>
                  updateCriteria({ minFeeRate: Number(e.target.value) || 1 })
                }
                placeholder='1'
                min='1'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='max-size'>Max Size (vBytes)</Label>
              <Input
                id='max-size'
                type='number'
                value={criteria.maxSize || ''}
                onChange={(e) =>
                  updateCriteria({
                    maxSize: Number(e.target.value) || undefined
                  })
                }
                placeholder='100000'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='min-base-fee'>Min Base Fee (sats)</Label>
              <Input
                id='min-base-fee'
                type='number'
                value={criteria.minBaseFee || ''}
                onChange={(e) =>
                  updateCriteria({
                    minBaseFee: Number(e.target.value) || undefined
                  })
                }
                placeholder='1000'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='max-count'>Max Transaction Count</Label>
              <Input
                id='max-count'
                type='number'
                value={criteria.maxTransactionCount || ''}
                onChange={(e) =>
                  updateCriteria({
                    maxTransactionCount: Number(e.target.value) || undefined
                  })
                }
                placeholder='100'
                min='1'
              />
            </div>
          </div>

          {/* Advanced Criteria */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='max-ancestor'>Max Ancestor Count</Label>
              <Input
                id='max-ancestor'
                type='number'
                value={criteria.maxAncestorCount || ''}
                onChange={(e) =>
                  updateCriteria({
                    maxAncestorCount: Number(e.target.value) || undefined
                  })
                }
                placeholder='25'
                min='1'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='max-descendant'>Max Descendant Count</Label>
              <Input
                id='max-descendant'
                type='number'
                value={criteria.maxDescendantCount || ''}
                onChange={(e) =>
                  updateCriteria({
                    maxDescendantCount: Number(e.target.value) || undefined
                  })
                }
                placeholder='25'
                min='1'
              />
            </div>
          </div>

          <Separator />

          {/* Selection Preferences */}
          <div className='space-y-4'>
            <h4 className='text-sm font-medium'>Selection Preferences</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='require-template'>Require Template</Label>
                  <p className='text-muted-foreground text-xs'>
                    Only run auto-selection when a template is available
                  </p>
                </div>
                <Switch
                  id='require-template'
                  checked={criteria.requireTemplate || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ requireTemplate: checked })
                  }
                />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='clear-existing'>
                    Clear Existing Selections
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    Remove current selections before auto-selecting new ones
                  </p>
                </div>
                <Switch
                  id='clear-existing'
                  checked={criteria.clearExistingSelections || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ clearExistingSelections: checked })
                  }
                />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='periodic-enabled'>
                    Enable Periodic Auto-Selection
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    Run auto-selection at regular intervals
                  </p>
                </div>
                <Switch
                  id='periodic-enabled'
                  checked={criteria.periodicEnabled || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ periodicEnabled: checked })
                  }
                />
              </div>
              {criteria.periodicEnabled && (
                <div className='space-y-2'>
                  <Label htmlFor='periodic-interval'>Interval (seconds)</Label>
                  <Input
                    id='periodic-interval'
                    type='number'
                    value={criteria.periodicInterval || 30}
                    onChange={(e) =>
                      updateCriteria({
                        periodicInterval: Number(e.target.value) || 30
                      })
                    }
                    placeholder='30'
                    min='5'
                    max='300'
                  />
                </div>
              )}
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='auto-job-declaration'>
                    Auto Job Declaration
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    Automatically declare job after successful auto-selection
                  </p>
                </div>
                <Switch
                  id='auto-job-declaration'
                  checked={criteria.autoJobDeclaration || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ autoJobDeclaration: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Exclusion Preferences */}
          <div className='space-y-4'>
            <h4 className='text-sm font-medium'>Exclusion Preferences</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='exclude-replaceable'>
                  Exclude BIP125 Replaceable
                </Label>
                <Switch
                  id='exclude-replaceable'
                  checked={criteria.excludeBip125Replaceable || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ excludeBip125Replaceable: checked })
                  }
                />
              </div>
              <div className='flex items-center justify-between'>
                <Label htmlFor='exclude-unbroadcast'>Exclude Unbroadcast</Label>
                <Switch
                  id='exclude-unbroadcast'
                  checked={criteria.excludeUnbroadcast || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ excludeUnbroadcast: checked })
                  }
                />
              </div>
            </div>
          </div>
        </>
      }
    </div>
  );
}
