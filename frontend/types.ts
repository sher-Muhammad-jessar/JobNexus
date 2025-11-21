export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  profileCompletion: number;
  // Add the new fields
  title?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  experienceLevel?: string;
  resumeUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  salary?: string;
  description: string;
  requiredSkills: string[];
  postedDate: string;
  deadline?: string;
  applyUrl?: string;
  isSaved?: boolean;
  matchScore?: number;
  remote?: boolean;
  requirements?: string[];
  tags?: string[];
  url?: string;
  savedAt?: string | null;
  raw?: any;
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  REMOTE = 'REMOTE',
  INTERNSHIP = 'INTERNSHIP'
}

export interface DashboardStats {
  newMatches: number;
  totalApplications: number;
  profileMatch: number;
  applyLater: number;
  urgentDeadlineCount?: number;
  pendingApplications?: number;
  interviewsScheduled?: number;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  appliedDate: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    logoUrl?: string;
  };
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW = 'INTERVIEW',
  REJECTED = 'REJECTED',
  OFFER = 'OFFER',
  ACCEPTED = 'ACCEPTED',
  PENDING = 'PENDING'
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface SaveJobResponse {
  status: 'saved' | 'exists' | 'error';
  message: string;
  jobId?: string;
}

export interface UnsaveJobResponse {
  status: 'removed' | 'not_found' | 'error';
  message: string;
  jobId?: string;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  type?: JobType[];
  remote?: boolean;
  skills?: string[];
  salaryRange?: {
    min: number;
    max: number;
  };
  experienceLevel?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Backend-specific interfaces
export interface BackendJob {
  job_id?: string;
  id?: string;
  _id?: string;
  title: string;
  company_name?: string;
  location: string;
  remote?: boolean;
  raw?: {
    employment_type?: string;
    salary?: string;
    last_date?: string;
    requirements?: string[];
  };
  description?: string;
  date_posted?: string;
  matched_skills?: string[];
  match_score?: number;
  url?: string;
  saved_at?: string;
  role?: string;
}

export interface BackendSavedJob {
  jobs?: any[];
  apply_later?: any[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
}

// API Service Types
export interface AuthService {
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<User>;
  getProfile: () => Promise<User>;
  updateSkills: (skills: string[]) => Promise<User>;
  updateProfile?: (user: Partial<User>) => Promise<User>; // Add this for future use
}

export interface JobsService {
  getAll: (query?: string, filters?: JobSearchFilters) => Promise<Job[]>;
  getRecommended: () => Promise<Job[]>;
  getById: (id: string) => Promise<Job>;
  save: (id: string) => Promise<SaveJobResponse>;
  unsave: (id: string) => Promise<UnsaveJobResponse>;
  getSaved: () => Promise<Job[]>;
  getApplyLater: () => Promise<Job[]>;
  checkSavedStatus: (jobId: string) => Promise<boolean>;
  getSavedCount: () => Promise<number>;
  fetchJobs: () => Promise<{status: string; message: string}>;
}

export interface ApplicationsService {
  getAll: () => Promise<Application[]>;
  create: (jobId: string) => Promise<Application>;
  updateStatus: (applicationId: string, status: ApplicationStatus) => Promise<Application>;
  delete: (applicationId: string) => Promise<void>;
}

export interface DashboardService {
  getStats: () => Promise<DashboardStats>;
  getNotifications: () => Promise<Notification[]>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

export interface HealthService {
  check: () => Promise<HealthCheckResponse>;
}