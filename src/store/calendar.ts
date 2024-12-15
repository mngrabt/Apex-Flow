import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { sendNotification } from '../services/notificationService';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  status: 'scheduled' | 'unassigned' | 'completed';
  createdAt: string;
  protocolId?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  unscheduledEvents: CalendarEvent[];
  completedEvents: CalendarEvent[];
  fetchEvents: () => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>;
  scheduleEvent: (protocolId: string, date: string) => Promise<void>;
  updateEventDate: (eventId: string, newDate: string) => Promise<void>;
  markEventComplete: (eventId: string) => Promise<void>;
  undoEventComplete: (eventId: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  unscheduledEvents: [],
  completedEvents: [],

  fetchEvents: async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Filter events by status
      const allEvents = data || [];
      const unscheduledEvents = allEvents.filter(event => event.status === 'unassigned');
      const scheduledEvents = allEvents.filter(event => event.status === 'scheduled');
      const completedEvents = allEvents.filter(event => event.status === 'completed');
      
      set({ 
        events: scheduledEvents,
        unscheduledEvents,
        completedEvents
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  createEvent: async (event) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          ...event,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // If event is unassigned, notify Abdurauf
      if (event.status === 'unassigned') {
        await sendNotification('EVENT_NEEDS_SCHEDULING', {
          title: event.title
        });
      }

      await get().fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  scheduleEvent: async (protocolId: string, date: string) => {
    try {
      // Find the event by protocolId
      const { data: events, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('protocolId', protocolId)
        .eq('status', 'unassigned')
        .limit(1);

      if (fetchError) throw fetchError;
      if (!events || events.length === 0) {
        throw new Error('Event not found');
      }

      const event = events[0];

      // Update the event
      const { error: updateError } = await supabase
        .from('calendar_events')
        .update({ 
          date,
          status: 'scheduled'
        })
        .eq('id', event.id);

      if (updateError) throw updateError;

      // Send a single notification to both users
      await sendNotification('NEW_EVENT_SCHEDULED', {
        title: event.title,
        date: format(new Date(date), 'd MMMM yyyy', { locale: ru }),
        userIds: [
          '00000000-0000-0000-0000-000000000004', // Akmal
          '00000000-0000-0000-0000-000000000005'  // Umar
        ]
      });

      await get().fetchEvents();
    } catch (error) {
      console.error('Error scheduling event:', error);
      throw error;
    }
  },

  updateEventDate: async (eventId: string, newDate: string) => {
    try {
      const event = get().events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      const { error } = await supabase
        .from('calendar_events')
        .update({ date: newDate })
        .eq('id', eventId);

      if (error) throw error;

      // Send a single notification to both users about the date change
      await sendNotification('NEW_EVENT_SCHEDULED', {
        title: event.title,
        date: format(new Date(newDate), 'd MMMM yyyy', { locale: ru }),
        userIds: [
          '00000000-0000-0000-0000-000000000004', // Akmal
          '00000000-0000-0000-0000-000000000005'  // Umar
        ]
      });

      await get().fetchEvents();
    } catch (error) {
      console.error('Error updating event date:', error);
      throw error;
    }
  },

  markEventComplete: async (eventId: string) => {
    try {
      const event = get().events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'completed' })
        .eq('id', eventId);

      if (error) throw error;

      // Send a single notification to all users
      await sendNotification('EVENT_COMPLETED', {
        title: event.title,
        userIds: [
          '00000000-0000-0000-0000-000000000001', // Abdurauf (admin)
          '00000000-0000-0000-0000-000000000004', // Akmal
          '00000000-0000-0000-0000-000000000005'  // Umar
        ]
      });

      await get().fetchEvents();
    } catch (error) {
      console.error('Error completing event:', error);
      throw error;
    }
  },

  undoEventComplete: async (eventId: string) => {
    try {
      const event = get().completedEvents.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'scheduled' })
        .eq('id', eventId);

      if (error) throw error;

      await get().fetchEvents();
    } catch (error) {
      console.error('Error undoing event completion:', error);
      throw error;
    }
  }
}));