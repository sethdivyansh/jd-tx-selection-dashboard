'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageContainer from '@/components/layout/page-container';
import { GeneralSettingsTab } from '@/components/settings/general-settings-tab';
import { useSettings } from '@/contexts/SettingsContext';
import { RotateCcw, Settings, User, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const { resetSettings, error, isLoading } = useSettings();

  const handleResetSettings = () => {
    resetSettings();
    toast.success('Settings Reset', {
      description: 'All settings have been reset to their default values.'
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex h-64 w-full items-center justify-center'>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span className='text-muted-foreground'>Loading settings...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='w-full space-y-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-1'>
            <h2 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
              <Settings className='h-8 w-8' />
              Dashboard Settings
            </h2>
            <div className='flex items-center gap-4'>
              <p className='text-muted-foreground'>
                Configure general dashboard preferences and settings
              </p>
            </div>
          </div>
          <Button
            variant='outline'
            onClick={handleResetSettings}
            className='flex shrink-0 items-center gap-2'
          >
            <RotateCcw className='h-4 w-4' />
            Reset All Settings
          </Button>
        </div>

        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {error} Settings are being saved locally as backup.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              General Preferences
            </CardTitle>
            <CardDescription>
              Customize dashboard behavior, notifications, and user interface
              preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneralSettingsTab />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
