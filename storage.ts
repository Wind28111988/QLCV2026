
import { supabase } from './supabase';
import { Task, User } from './types';

export const cloudStorage = {
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data || []).map(u => ({
        id: u.id,
        name: u.name,
        position: u.position,
        unit: u.unit,
        gender: u.gender,
        dob: u.dob,
        phone: u.phone,
        email: u.email,
        password: u.password,
        delegateLevel: u.delegateLevel, // Postgres tự động ánh xạ nếu select *
        notes: u.notes,
        mustChangePassword: u.mustChangePassword
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('startTime', { ascending: false });
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        userId: t.userId,
        content: t.content,
        startTime: Number(t.startTime),
        completedTime: t.completedTime ? Number(t.completedTime) : undefined,
        status: t.status,
        complexity: t.complexity,
        leadId: t.leadId,
        collaboratorIds: t.collaboratorIds || [],
        unit: t.unit,
        attachments: t.attachments || []
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async upsertUser(user: User): Promise<{ success: boolean; error?: any }> {
    try {
      // Đảm bảo các key trùng với cột trong SQL (Case-sensitive vì dùng dấu ngoặc kép trong SQL)
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        position: user.position,
        unit: user.unit,
        gender: user.gender,
        dob: user.dob,
        phone: user.phone,
        email: user.email,
        password: user.password,
        delegateLevel: user.delegateLevel,
        notes: user.notes,
        mustChangePassword: user.mustChangePassword
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error upserting user:', error);
      return { success: false, error };
    }
  },

  async insertTask(task: Task): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from('tasks').insert({
        id: task.id,
        userId: task.userId, 
        content: task.content,
        startTime: task.startTime,
        completedTime: task.completedTime || null,
        status: task.status,
        complexity: task.complexity,
        leadId: task.leadId,
        collaboratorIds: task.collaboratorIds || [],
        unit: task.unit,
        attachments: task.attachments || []
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error inserting task:', error);
      return { success: false, error };
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error };
    }
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error };
    }
  }
};
