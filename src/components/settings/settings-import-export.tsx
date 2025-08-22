import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsImportExport() {
  const { settings, updateSettings } = useSettings();

  const handleExportSettings = () => {
    try {
      const settingsData = JSON.stringify(settings, null, 2);
      const blob = new Blob([settingsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `jd-dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Settings exported successfully');
    } catch (error) {
      toast.error('Failed to export settings');
    }
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          updateSettings(importedSettings);
          toast.success('Settings imported successfully');
        } catch (error) {
          toast.error(
            'Failed to import settings. Please check the file format.'
          );
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings Backup & Restore</CardTitle>
        <CardDescription>
          Export your settings for backup or import previously saved settings
        </CardDescription>
      </CardHeader>
      <CardContent className='flex gap-2'>
        <Button
          variant='outline'
          onClick={handleExportSettings}
          className='flex items-center gap-2'
        >
          <Download className='h-4 w-4' />
          Export Settings
        </Button>

        <Button
          variant='outline'
          onClick={handleImportSettings}
          className='flex items-center gap-2'
        >
          <Upload className='h-4 w-4' />
          Import Settings
        </Button>
      </CardContent>
    </Card>
  );
}
