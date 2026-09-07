import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const data = await apiRequest('/notifications');
      setUnread(data.unread || 0);
      setNotifications(data.notifications || []);
    } catch (error) {
      setUnread(0);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    await apiRequest('/notifications/read-all', 'POST');
    setUnread(0);
    setNotifications(current => current.map(notification => ({ ...notification, is_read: 1 })));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(value => !value)} className="relative rounded-xl border border-tadka-border bg-tadka-card p-2 text-slate-300 hover:text-white" title="Notifications">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-tadka-orange px-1 text-center text-[10px] font-black text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-tadka-border bg-tadka-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between border-b border-tadka-border/60 pb-2">
            <span className="text-sm font-bold text-white">Notifications</span>
            {unread > 0 && <button onClick={markAllRead} className="text-[10px] font-bold text-amber-300">Mark all read</button>}
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? <p className="py-4 text-center text-xs text-slate-400">No notifications yet.</p> : notifications.map(notification => (
              <div key={notification.id} className={`rounded-xl p-2 text-xs ${notification.is_read ? 'bg-tadka-dark/40 text-slate-400' : 'bg-amber-500/10 text-slate-200'}`}>
                <p>{notification.message}</p>
                <p className="mt-1 text-[10px] text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
