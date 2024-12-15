import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { sendNotification } from '../services/notificationService';

interface TaskState {
  tasks: Task[];
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  reopenTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  fetchTasks: async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform snake_case to camelCase
      const transformedTasks = (data || []).map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        documentUrl: task.document_url,
        createdBy: task.created_by,
        createdAt: task.created_at,
        completedAt: task.completed_at
      }));

      set({ tasks: transformedTasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  createTask: async (task) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          name: task.name,
          description: task.description,
          document_url: task.documentUrl,
          created_by: task.createdBy,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Notify Abdurauf about new task
      await sendNotification('NEW_TASK', {
        name: task.name
      });

      await get().fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Also delete the document from storage if it exists
      const task = get().tasks.find(t => t.id === taskId);
      if (task?.documentUrl) {
        const filePath = task.documentUrl.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('documents')
            .remove([`tasks/${filePath}`]);
        }
      }

      await get().fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      await get().fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  reopenTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed_at: null })
        .eq('id', taskId);

      if (error) throw error;

      await get().fetchTasks();
    } catch (error) {
      console.error('Error reopening task:', error);
      throw error;
    }
  }
}));