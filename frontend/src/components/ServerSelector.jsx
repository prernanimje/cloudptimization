/**
 * Server Selector Component - Dropdown to switch between servers
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export const ServerSelector = ({ instances = [], selectedInstance = null, onSelect = () => { } }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Get display name
  const displayName = selectedInstance?.name || (instances.length === 0 ? 'No servers (Upload CSV first)' : 'Select a server...');

  return (
    <div className="relative w-full min-w-[240px] max-w-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[12px] px-3 py-1.5 flex items-center justify-between hover:border-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-[var(--text-primary)] text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🖥️</span>
          <span className="font-medium text-[var(--text-primary)] truncate">{displayName}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-[var(--text-secondary)] transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[12px] shadow-xl z-10 max-h-80 overflow-y-auto hide-scrollbar">
          {instances.length === 0 ? (
            <div className="px-3 py-3 text-center">
              <p className="text-[var(--text-secondary)] text-xs mb-1">No server data available.</p>
              <p className="text-blue-400 text-xs font-semibold">Please upload your CSV file first</p>
            </div>
          ) : (
            instances.map((instance) => (
              <button
                key={instance.id}
                onClick={() => {
                  onSelect(instance);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-[var(--sidebar-hover)] border-b border-[var(--border-color)] last:border-b-0 transition text-sm ${selectedInstance?.id === instance.id ? 'bg-[var(--sidebar-hover)] font-semibold' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--text-primary)] text-sm">{instance.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{instance.region} • ${instance.monthly_cost}/mo</p>
                  </div>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${instance.status === 'healthy'
                      ? 'bg-green-500'
                      : instance.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                      }`}
                  />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ServerSelector;
