
import { supabase } from './supabase';
import { Task, User } from './types';

export const cloudStorage = {
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data || []).map((u: any) => ({
        id: String(u.id),
        name: String(u.name),
        position: String(u.position),
        unit: String(u.unit),
        gender: u.gender,
        dob: String(u.dob),
        phone: String(u.phone),
        email: String(u.email),
        password: String(u.password),
        delegateLevel: String(u.delegateLevel),
        notes: String(u.notes),
        mustChangePassword: Boolean(u.mustChangePassword)
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
      return (data || []).map((t: any) => ({
        id: String(t.id),
        userId: String(t.userId),
        content: String(t.content),
        startTime: Number(t.startTime),
        deadline: t.deadline ? Number(t.deadline) : undefined,
        completedTime: t.completedTime ? Number(t.completedTime) : undefined,
        status: t.status,
        complexity: t.complexity,
        leadId: String(t.leadId),
        collaboratorIds: t.collaboratorIds || [],
        unit: String(t.unit),
        attachments: t.attachments || []
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async upsertUser(user: User): Promise<{ success: boolean; error?: any }> {
    try {
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
        deadline: task.deadline || null,
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
      const dataToUpdate = { ...updates };
      if ('completedTime' in dataToUpdate && dataToUpdate.completedTime === undefined) {
        (dataToUpdate as any).completedTime = null;
      }
      if ('deadline' in dataToUpdate && dataToUpdate.deadline === undefined) {
        (dataToUpdate as any).deadline = null;
      }
      
      const { error } = await supabase.from('tasks').update(dataToUpdate).eq('id', taskId);
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
