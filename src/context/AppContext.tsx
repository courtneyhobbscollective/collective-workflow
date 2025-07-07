import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Brief, Staff, Invoice, ChatChannel, Notification, DashboardStats } from '../types';
import { useSupabase } from './SupabaseContext';

interface AppContextType {
  // Data
  clients: Client[];
  briefs: Brief[];
  staff: Staff[];
  invoices: Invoice[];
  chatChannels: ChatChannel[];
  notifications: Notification[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addBrief: (brief: Omit<Brief, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBrief: (id: string, updates: Partial<Brief>, optimisticUpdate?: boolean) => Promise<void>;
  deleteBrief: (id: string) => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase();
  const [clients, setClients] = useState<Client[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate dashboard stats
  const calculateDashboardStats = () => {
    const totalClients = clients.length;
    const activeBriefs = briefs.filter(b => b.stage !== 'client-submission').length;
    const monthlyRevenue = invoices
      .filter(i => i.status === 'paid' && i.paidDate && new Date(i.paidDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const staffUtilization = staff.length > 0 ? Math.round((staff.length / Math.max(staff.length, 1)) * 100) : 0;

    setDashboardStats({
      totalClients,
      activeBriefs,
      monthlyRevenue,
      staffUtilization,
      overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
      pendingReviews: briefs.filter(b => b.stage === 'final-delivery').length
    });
  };

  // Utility to map a DB brief row to the Brief TypeScript interface
  function mapDbBriefToBrief(dbBrief: any): Brief {
    try {
      return {
        id: dbBrief.id,
        clientId: dbBrief.client_id,
        title: dbBrief.title,
        description: dbBrief.description,
        workType: dbBrief.work_type,
        projectValue: Number(dbBrief.project_value) || 0,
        poNumber: dbBrief.po_number,
        dueDate: new Date(dbBrief.due_date),
        deliverables: dbBrief.deliverables || [],
        estimatedHours: dbBrief.estimated_hours || { shoot: 0, edit: 0 },
        template: dbBrief.template,
        stage: dbBrief.stage,
        status: dbBrief.status || 'in-progress',
        isRecurring: dbBrief.is_recurring || false,
        recurrencePattern: dbBrief.recurrence_pattern,
        assignedStaff: dbBrief.assigned_staff || [],
        reviewUrls: dbBrief.review_urls || {},
        contractSigned: dbBrief.contract_signed || false,
        tasks: dbBrief.tasks || [],
        createdAt: new Date(dbBrief.created_at),
        updatedAt: new Date(dbBrief.updated_at)
      };
    } catch (error) {
      console.error('Error mapping brief:', error, dbBrief);
      // Return a safe fallback
      return {
        id: dbBrief.id || 'unknown',
        clientId: dbBrief.client_id || '',
        title: dbBrief.title || 'Unknown Brief',
        description: dbBrief.description || '',
        workType: dbBrief.work_type || 'photography',
        projectValue: Number(dbBrief.project_value) || 0,
        poNumber: dbBrief.po_number || '',
        dueDate: new Date(dbBrief.due_date || Date.now()),
        deliverables: dbBrief.deliverables || [],
        estimatedHours: dbBrief.estimated_hours || { shoot: 0, edit: 0 },
        template: dbBrief.template || 'standard',
        stage: dbBrief.stage || 'incoming',
        status: 'in-progress',
        isRecurring: dbBrief.is_recurring || false,
        recurrencePattern: dbBrief.recurrence_pattern,
        assignedStaff: dbBrief.assigned_staff || [],
        reviewUrls: dbBrief.review_urls || {},
        contractSigned: dbBrief.contract_signed || false,
        tasks: dbBrief.tasks || [],
        createdAt: new Date(dbBrief.created_at || Date.now()),
        updatedAt: new Date(dbBrief.updated_at || Date.now())
      };
    }
  }

  // Fetch all data from Supabase on mount
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client is null!');
      setError('Supabase connection not available');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Fetch data with individual error handling
        const results = await Promise.allSettled([
          supabase.from('clients').select('*'),
          supabase.from('briefs').select('*'),
          supabase.from('staff').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('chat_channels').select('*'),
          supabase.from('notifications').select('*'),
        ]);

        // Process results and handle errors gracefully
        const [clientsRes, briefsRes, staffRes, invoicesRes, chatChannelsRes, notificationsRes] = results;

        // Set data for successful requests, empty array for failed ones
        if (clientsRes.status === 'fulfilled' && !clientsRes.value.error) {
          // Convert database column names to TypeScript interface names
          const convertedClients = (clientsRes.value.data || []).map(dbClient => ({
            id: dbClient.id,
            name: dbClient.name,
            companyName: dbClient.company_name,
            email: dbClient.email,
            phone: dbClient.phone,
            type: dbClient.type,
            brandAssets: dbClient.brand_assets || [],
            brandGuidelines: dbClient.brand_guidelines,
            brandToneOfVoice: dbClient.brand_tone_of_voice,
            brandColors: dbClient.brand_colors || [],
            brandFonts: dbClient.brand_fonts || [],
            socialMedia: dbClient.social_media || [],
            contractTemplate: dbClient.contract_template,
            chatChannelId: dbClient.chat_channel_id,
            createdAt: new Date(dbClient.created_at),
            updatedAt: new Date(dbClient.updated_at)
          }));
          setClients(convertedClients);
        } else {
          console.warn('Failed to fetch clients:', clientsRes.status === 'rejected' ? clientsRes.reason : clientsRes.value?.error);
          setClients([]);
        }

        if (briefsRes.status === 'fulfilled' && !briefsRes.value.error) {
          setBriefs((briefsRes.value.data || []).map(mapDbBriefToBrief));
        } else {
          console.warn('Failed to fetch briefs:', briefsRes.status === 'rejected' ? briefsRes.reason : briefsRes.value?.error);
          setBriefs([]);
        }

        if (staffRes.status === 'fulfilled' && !staffRes.value.error) {
          // Convert database column names to TypeScript interface names
          const convertedStaff = (staffRes.value.data || []).map(dbStaff => ({
            id: dbStaff.id,
            name: dbStaff.name,
            email: dbStaff.email,
            role: dbStaff.role,
            avatar: dbStaff.avatar_url || '',
            monthlyAvailableHours: dbStaff.monthly_available_hours || 160,
            hourlyRate: Number(dbStaff.hourly_rate) || 0,
            skills: dbStaff.skills || [],
            calendar: dbStaff.calendar || [],
            createdAt: new Date(dbStaff.created_at),
            updatedAt: new Date(dbStaff.updated_at)
          }));
          setStaff(convertedStaff);
        } else {
          console.warn('Failed to fetch staff:', staffRes.status === 'rejected' ? staffRes.reason : staffRes.value?.error);
          setStaff([]);
        }

        if (invoicesRes.status === 'fulfilled' && !invoicesRes.value.error) {
          setInvoices(invoicesRes.value.data || []);
        } else {
          console.warn('Failed to fetch invoices:', invoicesRes.status === 'rejected' ? invoicesRes.reason : invoicesRes.value?.error);
          setInvoices([]);
        }

        if (chatChannelsRes.status === 'fulfilled' && !chatChannelsRes.value.error) {
          setChatChannels(chatChannelsRes.value.data || []);
        } else {
          console.warn('Failed to fetch chat channels:', chatChannelsRes.status === 'rejected' ? chatChannelsRes.reason : chatChannelsRes.value?.error);
          setChatChannels([]);
        }

        if (notificationsRes.status === 'fulfilled' && !notificationsRes.value.error) {
          // Convert database column names to TypeScript interface names
          const convertedNotifications = (notificationsRes.value.data || []).map(dbNotification => ({
            id: dbNotification.id,
            userId: dbNotification.user_id,
            title: dbNotification.title,
            message: dbNotification.message,
            type: dbNotification.type,
            read: dbNotification.read,
            actionUrl: dbNotification.action_url,
            createdAt: new Date(dbNotification.created_at)
          }));
          setNotifications(convertedNotifications);
        } else {
          console.warn('Failed to fetch notifications:', notificationsRes.status === 'rejected' ? notificationsRes.reason : notificationsRes.value?.error);
          setNotifications([]);
        }

        // Only show error if all requests failed
        const failedRequests = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
        if (failedRequests.length === results.length) {
          setError('Failed to fetch data from Supabase. Please check your database setup.');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data from Supabase');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Data fetching timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    fetchData().finally(() => {
      // Clear the timeout when fetchData completes
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [supabase]);

  // Recalculate dashboard stats when data changes
  useEffect(() => {
    calculateDashboardStats();
  }, [clients, briefs, staff, invoices, notifications]);

  // Force loading to false if we have data
  useEffect(() => {
    if (loading && (clients.length > 0 || briefs.length > 0 || staff.length > 0)) {
      console.log('Forcing loading to false - we have data');
      setLoading(false);
    }
  }, [loading, clients.length, briefs.length, staff.length]);

  // Example: Add client
  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    
    // Convert TypeScript interface names to database column names
    const dbClient = {
      name: client.name,
      company_name: client.companyName,
      email: client.email,
      phone: client.phone,
      type: client.type,
      brand_assets: client.brandAssets,
      brand_guidelines: client.brandGuidelines,
      brand_tone_of_voice: client.brandToneOfVoice,
      brand_colors: client.brandColors,
      brand_fonts: client.brandFonts,
      social_media: client.socialMedia,
      contract_template: client.contractTemplate,
      chat_channel_id: client.chatChannelId || null
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert([dbClient])
      .select();
    if (error) {
      setError(error.message);
    } else {
      // Convert database column names back to TypeScript interface names
      const convertedData = (data || []).map(dbClient => ({
        id: dbClient.id,
        name: dbClient.name,
        companyName: dbClient.company_name,
        email: dbClient.email,
        phone: dbClient.phone,
        type: dbClient.type,
        brandAssets: dbClient.brand_assets || [],
        brandGuidelines: dbClient.brand_guidelines,
        brandToneOfVoice: dbClient.brand_tone_of_voice,
        brandColors: dbClient.brand_colors || [],
        brandFonts: dbClient.brand_fonts || [],
        socialMedia: dbClient.social_media || [],
        contractTemplate: dbClient.contract_template,
        chatChannelId: dbClient.chat_channel_id,
        createdAt: new Date(dbClient.created_at),
        updatedAt: new Date(dbClient.updated_at)
      }));
      setClients(prev => [...prev, ...convertedData]);
    }
    setLoading(false);
  };

  // Example: Update client
  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    
    // Convert TypeScript interface names to database column names
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.brandAssets !== undefined) dbUpdates.brand_assets = updates.brandAssets;
    if (updates.brandGuidelines !== undefined) dbUpdates.brand_guidelines = updates.brandGuidelines;
    if (updates.brandToneOfVoice !== undefined) dbUpdates.brand_tone_of_voice = updates.brandToneOfVoice;
    if (updates.brandColors !== undefined) dbUpdates.brand_colors = updates.brandColors;
    if (updates.brandFonts !== undefined) dbUpdates.brand_fonts = updates.brandFonts;
    if (updates.socialMedia !== undefined) dbUpdates.social_media = updates.socialMedia;
    if (updates.contractTemplate !== undefined) dbUpdates.contract_template = updates.contractTemplate;
    if (updates.chatChannelId !== undefined) dbUpdates.chat_channel_id = updates.chatChannelId || null;
    
    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    if (error) {
      setError(error.message);
    } else {
      // Convert database column names back to TypeScript interface names
      const convertedData = (data || []).map(dbClient => ({
        id: dbClient.id,
        name: dbClient.name,
        companyName: dbClient.company_name,
        email: dbClient.email,
        phone: dbClient.phone,
        type: dbClient.type,
        brandAssets: dbClient.brand_assets || [],
        brandGuidelines: dbClient.brand_guidelines,
        brandToneOfVoice: dbClient.brand_tone_of_voice,
        brandColors: dbClient.brand_colors || [],
        brandFonts: dbClient.brand_fonts || [],
        socialMedia: dbClient.social_media || [],
        contractTemplate: dbClient.contract_template,
        chatChannelId: dbClient.chat_channel_id,
        createdAt: new Date(dbClient.created_at),
        updatedAt: new Date(dbClient.updated_at)
      }));
      setClients(prev => prev.map(c => c.id === id ? convertedData[0] : c));
    }
    setLoading(false);
  };

  // Delete client
  const deleteClient = async (id: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setClients(prev => prev.filter(c => c.id !== id));
    }
    setLoading(false);
  };

  // Brief CRUD operations
  const addBrief = async (brief: Omit<Brief, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    
    // Convert TypeScript interface names to database column names
    const dbBrief = {
      client_id: brief.clientId,
      title: brief.title,
      description: brief.description,
      work_type: brief.workType,
      project_value: brief.projectValue,
      po_number: brief.poNumber,
      due_date: brief.dueDate.toISOString().split('T')[0],
      deliverables: brief.deliverables,
      estimated_hours: brief.estimatedHours,
      template: brief.template,
      stage: brief.stage,
      status: brief.status || 'in-progress',
      is_recurring: brief.isRecurring,
      recurrence_pattern: brief.recurrencePattern,
      assigned_staff: brief.assignedStaff,
      review_urls: brief.reviewUrls,
      contract_signed: brief.contractSigned,
      tasks: brief.tasks
    };
    
    const { data, error } = await supabase
      .from('briefs')
      .insert([dbBrief])
      .select();
    if (error) {
      setError(error.message);
    } else {
      setBriefs(prev => [...prev, ...(data || []).map(mapDbBriefToBrief)]);
    }
    setLoading(false);
  };

  const updateBrief = async (id: string, updates: Partial<Brief>, optimisticUpdate: boolean = false) => {
    if (!supabase) return;
    
    // For task and staff assignment updates, we can do optimistic updates to avoid UI flashing
    if (optimisticUpdate && (updates.tasks !== undefined || updates.assignedStaff !== undefined)) {
      // Update local state immediately
      setBriefs(prev => prev.map(b => {
        if (b.id === id) {
          return { ...b, ...updates, updatedAt: new Date() };
        }
        return b;
      }));
    } else {
      // For other updates, show loading state
      setLoading(true);
    }
    
    setError(null);
    
    // Convert TypeScript interface names to database column names
    const dbUpdates: any = {};
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.workType !== undefined) dbUpdates.work_type = updates.workType;
    if (updates.projectValue !== undefined) dbUpdates.project_value = updates.projectValue;
    if (updates.poNumber !== undefined) dbUpdates.po_number = updates.poNumber;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate.toISOString().split('T')[0];
    if (updates.deliverables !== undefined) dbUpdates.deliverables = updates.deliverables;
    if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;
    if (updates.template !== undefined) dbUpdates.template = updates.template;
    if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
    if (updates.recurrencePattern !== undefined) dbUpdates.recurrence_pattern = updates.recurrencePattern;
    if (updates.assignedStaff !== undefined) dbUpdates.assigned_staff = updates.assignedStaff;
    if (updates.reviewUrls !== undefined) dbUpdates.review_urls = updates.reviewUrls;
    if (updates.contractSigned !== undefined) dbUpdates.contract_signed = updates.contractSigned;
    if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks;
    
    console.log('Updating brief:', { id, dbUpdates, optimisticUpdate });
    const { data, error } = await supabase
      .from('briefs')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    if (error) {
      console.error('Database update error:', error);
      setError(error.message);
      // If optimistic update failed, revert the local state
      if (optimisticUpdate) {
        setBriefs(prev => prev.map(b => {
          if (b.id === id) {
            return { ...b, updatedAt: new Date() };
          }
          return b;
        }));
      }
    } else {
      console.log('Database update successful:', data);
      // Update with server data to ensure consistency
      setBriefs(prev => prev.map(b => {
        if (b.id === id && data && data[0]) {
          return mapDbBriefToBrief(data[0]);
        }
        return b;
      }));
    }
    
    if (!optimisticUpdate) {
      setLoading(false);
    }
  };

  const deleteBrief = async (id: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('briefs')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setBriefs(prev => prev.filter(b => b.id !== id));
    }
    setLoading(false);
  };

  // Staff CRUD operations
  const addStaff = async (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    
    // Convert TypeScript interface names to database column names
    const dbStaff = {
      name: staff.name,
      email: staff.email,
      role: staff.role,
      avatar_url: staff.avatar,
      monthly_available_hours: staff.monthlyAvailableHours,
      hourly_rate: staff.hourlyRate,
      skills: staff.skills
    };
    
    const { data, error } = await supabase
      .from('staff')
      .insert([dbStaff])
      .select();
    if (error) {
      setError(error.message);
    } else {
      // Convert database column names back to TypeScript interface names
      const convertedData = (data || []).map(dbStaff => ({
        id: dbStaff.id,
        name: dbStaff.name,
        email: dbStaff.email,
        role: dbStaff.role,
        avatar: dbStaff.avatar_url || '',
        monthlyAvailableHours: dbStaff.monthly_available_hours || 160,
        hourlyRate: Number(dbStaff.hourly_rate) || 0,
        skills: dbStaff.skills || [],
        calendar: [],
        createdAt: new Date(dbStaff.created_at),
        updatedAt: new Date(dbStaff.updated_at)
      }));
      setStaff(prev => [...prev, ...convertedData]);
    }
    setLoading(false);
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    
    // Convert TypeScript interface names to database column names
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.monthlyAvailableHours !== undefined) dbUpdates.monthly_available_hours = updates.monthlyAvailableHours;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
    if (updates.calendar !== undefined) dbUpdates.calendar = updates.calendar;
    
    const { data, error } = await supabase
      .from('staff')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    if (error) {
      setError(error.message);
    } else {
      // Convert database column names back to TypeScript interface names and update state
      if (data && data[0]) {
        const updatedStaff = {
          id: data[0].id,
          name: data[0].name,
          email: data[0].email,
          role: data[0].role,
          avatar: data[0].avatar_url || '',
          monthlyAvailableHours: data[0].monthly_available_hours || 160,
          hourlyRate: Number(data[0].hourly_rate) || 0,
          skills: data[0].skills || [],
          calendar: data[0].calendar || [], // Use the calendar data from the database
          createdAt: new Date(data[0].created_at),
          updatedAt: new Date(data[0].updated_at)
        };
        setStaff(prev => prev.map(s => s.id === id ? updatedStaff : s));
      }
    }
    setLoading(false);
  };

  const deleteStaff = async (id: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
    setLoading(false);
  };

  // Notification operations
  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    
    // First, verify that the user exists in the profiles table
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', notification.userId)
        .single();
      
      if (profileError || !profileData) {
        console.error('User not found in profiles table:', notification.userId);
        setError('User not found - cannot create notification');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      setError('Error verifying user - cannot create notification');
      setLoading(false);
      return;
    }
    
    // Convert TypeScript interface names to database column names
    const dbNotification = {
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      action_url: notification.actionUrl
    };
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([dbNotification])
      .select();
    if (error) {
      setError(error.message);
    } else {
      // Convert database column names back to TypeScript interface names
      const convertedData = (data || []).map(dbNotification => ({
        id: dbNotification.id,
        userId: dbNotification.user_id,
        title: dbNotification.title,
        message: dbNotification.message,
        type: dbNotification.type,
        read: dbNotification.read,
        actionUrl: dbNotification.action_url,
        createdAt: new Date(dbNotification.created_at)
      }));
      setNotifications(prev => [...prev, ...convertedData]);
    }
    setLoading(false);
  };

  const markNotificationRead = async (id: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
    setLoading(false);
  };

  const clearError = () => setError(null);

  return (
    <AppContext.Provider value={{
      clients, briefs, staff, invoices, chatChannels, notifications, dashboardStats, loading, error,
      addClient, updateClient, deleteClient,
      addBrief, updateBrief, deleteBrief,
      addStaff, updateStaff, deleteStaff,
      addNotification, markNotificationRead, clearError
    }}>
      {children}
    </AppContext.Provider>
  );
};