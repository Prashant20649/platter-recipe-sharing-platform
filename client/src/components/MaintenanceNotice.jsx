import React from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceNotice() {
  const { settings, user } = useAuth();

  if (!settings?.maintenanceMode) return null;

  const isAdmin = user?.role === 'admin';

  return (
    <div className={`px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between ${
      isAdmin ? 'bg-amber-500 text-stone-900' : 'bg-rose-600 text-white'
    }`}>
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        {isAdmin ? (
          <>
            <ShieldCheck className="w-4 h-4 shrink-0 text-stone-900" />
            <span>
              <strong>Admin Notice:</strong> Maintenance Mode is currently <strong>ACTIVE</strong>. Regular users cannot browse or mutate data. You have unrestricted admin access.
            </span>
          </>
        ) : (
          <>
            <Wrench className="w-4 h-4 shrink-0 animate-spin" />
            <span>
              <strong>System Notice:</strong> {settings.siteName || 'Platter'} is currently undergoing scheduled maintenance. Some functions may be unavailable.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
