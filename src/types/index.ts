// Core Types for Creative Agency SaaS Platform

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff extends User {
  monthlyAvailableHours: number;
  hourlyRate: number;
  skills: string[];
  calendar: CalendarEntry[];
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  type: 'project' | 'retainer';
  brandAssets: string[];
  brandGuidelines?: string;
  brandToneOfVoice?: string;
  brandColors?: string[];
  brandFonts?: string[];
  socialMedia?: {
    platform: string;
    username: string;
    password?: string;
  }[];
  contractTemplate?: string;
  chatChannelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brief {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  workType: 'photography' | 'videography' | 'design' | 'marketing';
  projectValue: number;
  poNumber?: string;
  dueDate: Date;
  deliverables: Deliverable[];
  estimatedHours: {
    shoot: number;
    edit: number;
  };
  template: string;
  stage: BriefStage;
  status: BriefStatus;
  isRecurring: boolean;
  recurrencePattern?: 'weekly' | 'bi-weekly' | 'monthly';
  assignedStaff?: string[];
  reviewUrls: Record<string, string>;
  contractSigned: boolean;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export type BriefStage = 
  | 'incoming'
  | 'pre-production'
  | 'production'
  | 'amend-1'
  | 'amend-2'
  | 'final-delivery'
  | 'client-submission';

export type BriefStatus = 
  | 'in-progress'
  | 'on-hold'
  | 'waiting-for-client'
  | 'shoot-booked'
  | 'sent-for-client-feedback';

export interface Deliverable {
  id: string;
  briefId: string;
  title: string;
  type: 'photo' | 'video' | 'design' | 'document';
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  assignedStaff?: string;
  dueDate: Date;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
}

export interface CalendarEntry {
  id: string;
  staffId: string;
  briefId?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'booked' | 'blocked' | 'holiday' | 'meeting';
  color: string;
}

export interface ChatChannel {
  id: string;
  clientId: string;
  name: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'gif' | 'file';
  mentions: string[];
  timestamp: Date;
}

export interface Invoice {
  id: string;
  clientId: string;
  briefId: string;
  number: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalClients: number;
  activeBriefs: number;
  monthlyRevenue: number;
  staffUtilization: number;
  overdueInvoices: number;
  pendingReviews: number;
}