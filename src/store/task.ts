import { create } from 'zustand';
import { Task } from '../types';
import { supabase } from '../lib/supabase';

interface TaskState {
  tasks: Task[];
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'> & { document?: File }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task> & { document?: File }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  fetchTasks: async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTasks = (tasks || []).map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        documentUrl: task.document_url,
        createdAt: task.created_at,
        createdBy: task.created_by
      }));

      set({ tasks: mappedTasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  addTask: async (task) => {
    try {
      let documentUrl = undefined;

      if (task.document) {
        const fileExt = task.document.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `tasks/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, task.document);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        documentUrl = publicUrl;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          name: task.name,
          description: task.description,
          document_url: documentUrl,
          created_by: task.createdBy
        });

      if (error) throw error;

      await get().fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      let documentUrl = updates.documentUrl;

      if (updates.document) {
        // Delete old file if exists
        if (documentUrl) {
          const oldPath = documentUrl.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('documents')
              .remove([`tasks/${oldPath}`]);
          }
        }

        // Upload new file
        const fileExt = updates.document.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `tasks/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, updates.document);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        documentUrl = publicUrl;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          name: updates.name,
          description: updates.description,
          document_url: documentUrl
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      // Get task to check if it has a document
      const task = get().tasks.find(t => t.id === id);
      
      if (task?.documentUrl) {
        const fileName = task.documentUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('documents')
            .remove([`tasks/${fileName}`]);
        }
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
}));