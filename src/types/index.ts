export type UserRole = 'admin' | 'user';

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  password?: string; // used internally on server
}

export type SchedulerRole = 'owner' | 'editor' | 'viewer';

export interface SchedulerMember {
  user_id: string;
  username: string;
  name: string;
  avatar: string;
  role: SchedulerRole;
  joined_at: string;
}

export interface Scheduler {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  owner_id: string;
  members: SchedulerMember[];
  created_at: string;
}

export interface Invitation {
  id: string;
  scheduler_id: string;
  scheduler_name: string;
  scheduler_icon: string;
  scheduler_color: string;
  from_user_id: string;
  from_username: string;
  from_user_name: string;
  to_user_id: string;
  to_username: string;
  role: SchedulerRole;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export type RepeatType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface Schedule {
  id: string;
  scheduler_id: string;
  scheduler_name?: string;
  scheduler_color?: string;
  scheduler_icon?: string;
  author_id: string;
  author_name: string;
  author_username: string;
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  start_time?: string; // HH:mm
  end_time?: string; // HH:mm
  is_all_day: boolean;
  is_shared: boolean; // true: visible to scheduler members; false: private to author
  repeat_type: RepeatType;
  color: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface SystemStats {
  totalUsers: number;
  totalSchedulers: number;
  totalSchedules: number;
  pendingInvitations: number;
  activeUsers: number;
}
