import { useEffect, useState } from 'react';
import {
  getGlobalDataSourceStatus,
  subscribeToDataSourceStatus,
  DataSourceRuntimeStatus,
} from './sourceStatus';

export function useDataSourceStatus(): DataSourceRuntimeStatus {
  const [status, setStatus] = useState<DataSourceRuntimeStatus>(
    getGlobalDataSourceStatus(),
  );

  useEffect(() => {
    return subscribeToDataSourceStatus(() => {
      setStatus(getGlobalDataSourceStatus());
    });
  }, []);

  return status;
}
