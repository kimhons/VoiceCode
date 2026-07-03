/**
 * Sync Status Indicator
 * Shows cloud sync status
 */

import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export interface SyncStatusIndicatorProps {
  className?: string;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ className }) => {
  const [status, setStatus] = React.useState<'synced' | 'syncing' | 'offline'>('synced');

  const statusConfig = {
    synced: {
      icon: Cloud,
      text: 'Synced',
      color: 'text-green-600',
    },
    syncing: {
      icon: RefreshCw,
      text: 'Syncing...',
      color: 'text-blue-600',
    },
    offline: {
      icon: CloudOff,
      text: 'Offline',
      color: 'text-gray-400',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon
        className={`h-4 w-4 ${config.color} ${status === 'syncing' ? 'animate-spin' : ''}`}
      />
      <span className={`text-sm ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

export default SyncStatusIndicator;
