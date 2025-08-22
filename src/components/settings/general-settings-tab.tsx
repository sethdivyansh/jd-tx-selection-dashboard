import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useGeneralSettings, useSettings } from '@/contexts/SettingsContext';
import { SettingsImportExport } from './settings-import-export';

export function GeneralSettingsTab() {
  const { general, updateGeneral } = useGeneralSettings();
  const { saveSettings, isSaving } = useSettings();

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>UI Behavior</CardTitle>
          <CardDescription>
            Control how the dashboard behaves during transaction selection and
            job declarations
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='auto-scroll'>Auto-scroll to table</Label>
              <p className='text-muted-foreground text-sm'>
                Automatically scroll to the transaction table when prompted
              </p>
            </div>
            <Switch
              id='auto-scroll'
              checked={general.autoScrollToTable}
              onCheckedChange={(autoScrollToTable: boolean) =>
                updateGeneral({ autoScrollToTable })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='pause-on-selection'>Pause on selection</Label>
              <p className='text-muted-foreground text-sm'>
                Pause mempool updates when auto-selecting transactions
              </p>
            </div>
            <Switch
              id='pause-on-selection'
              checked={general.pauseOnSelection}
              onCheckedChange={(pauseOnSelection: boolean) =>
                updateGeneral({ pauseOnSelection })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='clear-selection'>
                Clear selection on job declaration
              </Label>
              <p className='text-muted-foreground text-sm'>
                Automatically clear selected transactions after successful job
                declaration
              </p>
            </div>
            <Switch
              id='clear-selection'
              checked={general.clearSelectionOnJobDeclaration}
              onCheckedChange={(clearSelectionOnJobDeclaration: boolean) =>
                updateGeneral({ clearSelectionOnJobDeclaration })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure when and how notifications are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='show-notifications'>Show notifications</Label>
              <p className='text-muted-foreground text-sm'>
                Display toast notifications for events and status updates
              </p>
            </div>
            <Switch
              id='show-notifications'
              checked={general.showNotifications}
              onCheckedChange={(showNotifications: boolean) =>
                updateGeneral({ showNotifications })
              }
            />
          </div>

          <div className='flex justify-end pt-4'>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className='min-w-[120px]'
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SettingsImportExport />
    </div>
  );
}
