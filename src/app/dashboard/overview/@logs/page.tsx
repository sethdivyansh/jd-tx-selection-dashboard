'use client';

import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useJobDeclarationLogs } from '@/contexts/JobDeclarationContext';

const getVariant = (
  level: string
): 'default' | 'destructive' | 'secondary' | 'outline' => {
  switch (level.toUpperCase()) {
    case 'ERROR':
      return 'destructive';
    case 'WARNING':
      return 'default';
    case 'INFO':
      return 'secondary';
    case 'DEBUG':
      return 'outline';
    default:
      return 'default';
  }
};

const LogViewer: React.FC = () => {
  const { logs } = useJobDeclarationLogs();

  return (
    <Card className='mx-auto w-full rounded-2xl border p-6 shadow-md'>
      <CardTitle className='text-3xl font-semibold'>Logs</CardTitle>
      <Separator />
      <CardContent className='p-0'>
        <ScrollArea className='h-[600px] pr-4'>
          {logs.length === 0 ? (
            <div className='text-muted-foreground flex items-center justify-center py-8'>
              <p>No logs available. Waiting for WebSocket connection...</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className='mb-4 last:mb-0'>
                <div className='mb-1 flex items-center justify-between'>
                  <div className='flex flex-row items-center gap-2'>
                    <Badge variant={getVariant(log.level)}>{log.level}</Badge>
                    <div className='font-medium'>{log.event}</div>
                  </div>
                  <span className='text-muted-foreground text-xs'>
                    {log.timestamp}
                  </span>
                </div>
                <pre className='text-sm whitespace-pre-wrap'>{log.message}</pre>
                {index < logs.length - 1 && <Separator className='my-2' />}
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LogViewer;
