
import { supabase } from './supabase';
import { Task, User, Document, TaskCategory } from './types';

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
        category: t.category || TaskCategory.KHAC,
        leadId: String(t.leadId),
        collaboratorIds: t.collaboratorIds || [],
        forwarderIds: t.forwarderIds || [],
        unit: String(t.unit),
        attachments: t.attachments || [],
        documentId: t.documentId ? String(t.documentId) : undefined,
        outDocNumber: t.outDocNumber ? String(t.outDocNumber) : undefined,
        completedBy: t.completedBy || []
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  async getDocuments(): Promise<Document[]> {
    try {
      const { data, error } = await supabase.from('documents').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        createdAt: Number(d.createdAt),
        category: d.category || TaskCategory.KHAC
      })) as Document[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  },

  async insertDocument(doc: Document): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from('documents').insert(doc);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error inserting document:', error);
      return { success: false, error };
    }
  },

  async insertTask(task: Task): Promise<{ success: boolean; error?: any }> {
    try {
      const dbTask = {
        id: task.id,
        userId: task.userId, 
        content: task.content,
        startTime: task.startTime,
        deadline: task.deadline || null,
        completedTime: task.completedTime || null,
        status: task.status,
        complexity: task.complexity,
        category: task.category,
        leadId: task.leadId,
        collaboratorIds: task.collaboratorIds || [],
        forwarderIds: task.forwarderIds || [],
        unit: task.unit,
        attachments: task.attachments || [],
        documentId: (task.documentId && task.documentId.trim() !== '') ? task.documentId : null,
        outDocNumber: (task.outDocNumber && task.outDocNumber.trim() !== '') ? task.outDocNumber : null,
        completedBy: task.completedBy || []
      };

      const { error } = await supabase.from('tasks').insert(dbTask);
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
      if ('documentId' in dataToUpdate) {
        dataToUpdate.documentId = (dataToUpdate.documentId && dataToUpdate.documentId.trim() !== '') ? dataToUpdate.documentId : (null as any);
      }
      if ('outDocNumber' in dataToUpdate) {
        dataToUpdate.outDocNumber = (dataToUpdate.outDocNumber && dataToUpdate.outDocNumber.trim() !== '') ? dataToUpdate.outDocNumber : (null as any);
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
  },

  async upsertUser(user: User): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from('users').upsert(user);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
};
