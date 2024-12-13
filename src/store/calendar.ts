import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  protocolId: string;
  completed?: boolean;
}

interface CalendarStore {
  events: CalendarEvent[];
  unscheduledEvents: CalendarEvent[];
  fetchEvents: () => Promise<void>;
  scheduleEvent: (protocolId: string, date: Date, userId?: string) => Promise<void>;
  updateEventDate: (eventId: string, newDate: Date, userId?: string) => Promise<void>;
  markEventComplete: (eventId: string, userId?: string) => Promise<void>;
  undoEventComplete: (eventId: string, userId?: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  unscheduledEvents: [],

  fetchEvents: async () => {
    try {
      // Fetch scheduled events
      const { data: scheduledEvents, error: scheduledError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          protocol:protocols!calendar_events_protocol_id_fkey(
            *,
            tender:tenders!protocols_tender_id_fkey(
              *,
              request:requests!tenders_request_id_fkey(
                *,
                items:request_items(*)
              )
            )
          )
        `)
        .order('date', { ascending: true });

      if (scheduledError) throw scheduledError;

      // Get IDs of scheduled protocols
      const scheduledProtocolIds = scheduledEvents?.map(e => e.protocol_id) || [];

      // Fetch unscheduled events (paid protocols without calendar events)
      let unscheduled = [];
      if (scheduledProtocolIds.length > 0) {
        const { data, error: unscheduledError } = await supabase
          .from('protocols')
          .select(`
            *,
            tender:tenders!protocols_tender_id_fkey(
              *,
              request:requests!tenders_request_id_fkey(
                *,
                items:request_items(*)
              )
            )
          `)
          .eq('finance_status', 'paid')
          .not('id', 'in', `(${scheduledProtocolIds.join(',')})`);

        if (unscheduledError) throw unscheduledError;
        unscheduled = data || [];
      } else {
        // If no scheduled events, fetch all paid protocols
        const { data, error: unscheduledError } = await supabase
          .from('protocols')
          .select(`
            *,
            tender:tenders!protocols_tender_id_fkey(
              *,
              request:requests!tenders_request_id_fkey(
                *,
                items:request_items(*)
              )
            )
          `)
          .eq('finance_status', 'paid');

        if (unscheduledError) throw unscheduledError;
        unscheduled = data || [];
      }

      // Map scheduled events
      const events = (scheduledEvents || [])
        .filter(event => event.protocol?.tender?.request?.items?.[0])
        .map(event => ({
          id: event.id,
          title: event.protocol.tender.request.items[0].name,
          date: event.date,
          protocolId: event.protocol_id,
          completed: event.completed || false
        }));

      // Map unscheduled events
      const unscheduledEvents = unscheduled
        .filter(protocol => protocol.tender?.request?.items?.[0])
        .map(protocol => ({
          id: protocol.id,
          title: protocol.tender.request.items[0].name,
          date: '',
          protocolId: protocol.id
        }));

      set({ events, unscheduledEvents });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },

  scheduleEvent: async (protocolId: string, date: Date, userId?: string) => {
    // Check if user is Abdurauf
    if (userId !== '00000000-0000-0000-0000-000000000001') {
      throw new Error('Unauthorized: Only Abdurauf can schedule events');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .insert({
          protocol_id: protocolId,
          date: date.toISOString(),
          completed: false
        });

      if (error) throw error;

      await get().fetchEvents();
    } catch (error) {
      console.error('Error scheduling event:', error);
      throw error;
    }
  },

  updateEventDate: async (eventId: string, newDate: Date, userId?: string) => {
    // Check if user is Abdurauf
    if (userId !== '00000000-0000-0000-0000-000000000001') {
      throw new Error('Unauthorized: Only Abdurauf can update event dates');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ date: newDate.toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      await get().fetchEvents();
    } catch (error) {
      console.error('Error updating event date:', error);
      throw error;
    }
  },

  markEventComplete: async (eventId: string, userId?: string) => {
    // Check if user is Abdurauf
    if (userId !== '00000000-0000-0000-0000-000000000001') {
      throw new Error('Unauthorized: Only Abdurauf can mark events as complete');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ completed: true })
        .eq('id', eventId);

      if (error) throw error;

      await get().fetchEvents();
    } catch (error) {
      console.error('Error marking event as complete:', error);
      throw error;
    }
  },

  undoEventComplete: async (eventId: string, userId?: string) => {
    // Check if user is Abdurauf
    if (userId !== '00000000-0000-0000-0000-000000000001') {
      throw new Error('Unauthorized: Only Abdurauf can undo event completion');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ completed: false })
        .eq('id', eventId);

      if (error) throw error;

      await get().fetchEvents();
    } catch (error) {
      console.error('Error undoing event completion:', error);
      throw error;
    }
  }
}));