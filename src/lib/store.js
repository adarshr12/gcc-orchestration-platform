import { supabase } from './supabase';

const TABLE_CONFIG = {
  users: { pk: 'id' },
  projects: { pk: 'id' },
  stages: { pk: 'id' },
  stage_gates: { pk: 'id' },
  milestones: { pk: 'id' },
  vendors: { pk: 'id' },
  vendor_compliance: { pk: 'id' },
  purchase_orders: { pk: 'id' },
  budget: { pk: 'id' },
  escalations: { pk: 'id' },
  escalation_comments: { pk: 'id' },
  notifications: { pk: 'id' },
  safety_checklists: { pk: 'id' },
  safety_checklist_items: { pk: 'id' },
  audit_logs: { pk: 'id' },
  comments: { pk: 'id' },
  attendance: { pk: 'id' },
};

const INITIAL_DATA = Object.keys(TABLE_CONFIG).reduce((acc, table) => {
  acc[table] = [];
  return acc;
}, {});

class DataStore {
  constructor() {
    this.data = { ...INITIAL_DATA };
    this.listeners = new Set();
    this.initialized = false;
    this.loading = false;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  // Force a fresh fetch regardless of current loading state (call after auth changes)
  async reload() {
    this.loading = false;
    this.initialized = false;
    return this.init();
  }

  async init() {
    if (this.loading) return;
    this.loading = true;
    
    try {
      const tables = Object.keys(this.data);
      const results = await Promise.all(
        tables.map(table => supabase.from(table).select('*'))
      );

      results.forEach((res, index) => {
        const table = tables[index];
        if (res.error) {
          console.error(`Error fetching ${table}:`, res.error);
        } else {
          this.data[table] = res.data || [];
        }
      });

      this.initialized = true;
      this.notify();
    } catch (err) {
      console.error('Failed to initialize store:', err);
    } finally {
      this.loading = false;
    }
  }

  getAll(table) {
    if (!this.initialized && !this.loading) this.init();
    return [...(this.data[table] || [])];
  }

  getById(table, id) {
    return this.data[table]?.find(r => r.id === id);
  }

  getWhere(table, predicate) {
    return (this.data[table] || []).filter(predicate);
  }

  async insert(table, record) {
    const { data, error } = await supabase.from(table).insert([record]).select();
    if (error) throw error;
    const newRecord = data[0];
    this.data[table].push(newRecord);
    this.notify();
    return newRecord;
  }

  async update(table, id, updates) {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select();
    if (error) throw error;
    const updatedRecord = data[0];
    const idx = this.data[table].findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data[table][idx] = updatedRecord;
      this.notify();
    }
    return updatedRecord;
  }

  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    this.data[table] = this.data[table].filter(r => r.id !== id);
    this.notify();
  }

  async addNotification(userId, type, message, entityType, entityId) {
    return this.insert('notifications', {
      user_id: userId,
      notification_type: type,
      message,
      related_entity_type: entityType,
      related_entity_id: entityId,
      is_read: false
    });
  }

  async addAuditLog(userId, action, entityType, entityId, oldValue, newValue) {
    return this.insert('audit_logs', {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue)
    });
  }
}

export const store = new DataStore();
store.init();
export default store;
