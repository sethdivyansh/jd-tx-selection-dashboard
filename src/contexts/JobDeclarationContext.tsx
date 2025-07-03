'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { toast } from 'sonner';
import type {
  NewTemplateNotification,
  LogEntry,
  JobDeclarationRequest,
  APIResponse
} from '@/types/index';

interface JobDeclarationContextType {
  logs: LogEntry[];
  currentTemplateId: number | null;
  declareJob: (txids: string[]) => Promise<boolean>;
  isLoading: boolean;
  addLog: (log: LogEntry) => void;
}

const JobDeclarationContext = createContext<
  JobDeclarationContextType | undefined
>(undefined);

interface JobDeclarationProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
}

export function JobDeclarationProvider({
  children,
  wsUrl = 'ws://localhost:3001/ws/jd/stream'
}: JobDeclarationProviderProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [log, ...prev].slice(0, 100));
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new ReconnectingWebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const connectLog: LogEntry = {
        event: 'WebSocketOpen',
        timestamp: new Date().toLocaleString(),
        level: 'INFO',
        message: 'Connected to job declaration stream'
      };
      addLog(connectLog);
    };

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as NewTemplateNotification;

        const logEntry: LogEntry = {
          event: notification.event,
          timestamp: new Date(notification.timestamp * 1000).toLocaleString(),
          level: 'INFO',
          message: notification.message
        };

        addLog(logEntry);

        if (notification.event === 'NewTemplate') {
          setCurrentTemplateId(notification.template_id);
        } else {
          setCurrentTemplateId(null);
        }

        toast.info(notification.event, {
          description: notification.message,
          action:
            notification.event === 'NewTemplate'
              ? {
                  label: 'Select Transactions',
                  onClick: () => {
                    const tableContainer = document.querySelector(
                      '.data-table-container'
                    );
                    if (tableContainer) {
                      tableContainer.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }
              : undefined,
          duration: 10000
        });
      } catch (error) {
        console.error(
          'JobDeclarationProvider: Failed to parse WebSocket message:',
          error
        );
        const errorLog: LogEntry = {
          event: 'WebSocketParseError',
          timestamp: new Date().toLocaleString(),
          level: 'ERROR',
          message: `Failed to parse WebSocket message: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        addLog(errorLog);
      }
    };

    ws.onerror = (_error) => {
      const errorLog: LogEntry = {
        event: 'WebSocketError',
        timestamp: new Date().toLocaleString(),
        level: 'ERROR',
        message: 'WebSocket connection error'
      };
      addLog(errorLog);
    };

    ws.onclose = () => {
      const closeLog: LogEntry = {
        event: 'WebSocketClose',
        timestamp: new Date().toLocaleString(),
        level: 'WARNING',
        message: 'Disconnected from job declaration stream'
      };
      addLog(closeLog);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wsUrl, addLog]);

  // Job declaration function
  const declareJob = useCallback(
    async (txids: string[]): Promise<boolean> => {
      if (!currentTemplateId) {
        toast.error('No template available', {
          description:
            'Please wait for a new template notification before declaring a job.'
        });
        return false;
      }

      if (txids.length === 0) {
        toast.error('No transactions selected', {
          description:
            'Please select at least one transaction to declare a job.'
        });
        return false;
      }

      setIsLoading(true);

      try {
        const requestBody: JobDeclarationRequest = {
          template_id: currentTemplateId,
          txids
        };

        const response = await fetch(
          'http://localhost:3001/api/job-declaration',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          }
        );

        const result: APIResponse<any> = await response.json();

        if (result.success) {
          toast.success('Job Declaration Successful!', {
            description: `Successfully declared job with ${txids.length} transactions for template ${currentTemplateId}.`
          });

          const successLog: LogEntry = {
            event: 'JobDeclarationSuccess',
            timestamp: new Date().toLocaleString(),
            level: 'INFO',
            message: `Job declared successfully with ${txids.length} transactions (template_id: ${currentTemplateId})`
          };
          addLog(successLog);

          return true;
        } else {
          toast.error('Job Declaration Failed', {
            description: result.message || 'An unknown error occurred.'
          });

          const errorLog: LogEntry = {
            event: 'JobDeclarationError',
            timestamp: new Date().toLocaleString(),
            level: 'ERROR',
            message: `Job declaration failed: ${result.message || 'Unknown error'}`
          };
          addLog(errorLog);

          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Network error';

        toast.error('Job Declaration Failed', {
          description: `Failed to declare job: ${errorMessage}`
        });

        const errorLog: LogEntry = {
          event: 'JobDeclarationError',
          timestamp: new Date().toLocaleString(),
          level: 'ERROR',
          message: `Job declaration failed: ${errorMessage}`
        };
        addLog(errorLog);

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentTemplateId, addLog]
  );

  const contextValue: JobDeclarationContextType = {
    logs,
    currentTemplateId,
    declareJob,
    isLoading,
    addLog
  };

  return (
    <JobDeclarationContext.Provider value={contextValue}>
      {children}
    </JobDeclarationContext.Provider>
  );
}

// Custom hook to use the JobDeclaration context
export function useJobDeclaration(): JobDeclarationContextType {
  const context = useContext(JobDeclarationContext);
  if (context === undefined) {
    throw new Error(
      'useJobDeclaration must be used within a JobDeclarationProvider'
    );
  }
  return context;
}

// Hook for components that only need logs
export function useJobDeclarationLogs() {
  const { logs, addLog } = useJobDeclaration();
  return { logs, addLog };
}

// Hook for components that only need job declaration functionality
export function useJobDeclarationActions() {
  const { currentTemplateId, declareJob, isLoading } = useJobDeclaration();
  return { currentTemplateId, declareJob, isLoading };
}
