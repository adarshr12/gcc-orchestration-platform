import { useState, useEffect, useCallback } from 'react';
import { store } from '../lib/store';

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  return store;
}

export function useStoreData(table, filter) {
  const [, setTick] = useState(0);

  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  if (filter) {
    return store.getWhere(table, filter);
  }
  return store.getAll(table);
}

export function useNotifications(userId) {
  const [, setTick] = useState(0);

  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const all = store.getWhere('notifications', n => n.user_id === userId);
  const unread = all.filter(n => !n.is_read);

  const markAsRead = useCallback((id) => {
    store.update('notifications', id, { is_read: true });
  }, []);

  const markAllAsRead = useCallback(() => {
    all.filter(n => !n.is_read).forEach(n => {
      store.update('notifications', n.id, { is_read: true });
    });
  }, [all]);

  return { notifications: all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), unreadCount: unread.length, markAsRead, markAllAsRead };
}
