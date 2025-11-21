import { 
  Job, 
  Application, 
  User, 
  DashboardStats, 
  Notification, 
  JobType, 
  ApplicationStatus,
  BackendJob,
  LoginResponse,
  SaveJobResponse,
  UnsaveJobResponse,
  HealthCheckResponse
} from '../types';

export const API_BASE_URL = "http://localhost:8040";

// Enhanced token management
const getValidToken = (): string | null => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('No access token found in localStorage');
    return null;
  }
  
  // Basic token validation
  if (token.length < 10) {
    console.error('Token appears to be invalid (too short)');
    localStorage.removeItem('access_token');
    return null;
  }
  
  return token;
};

const getHeaders = (): HeadersInit => {
  const token = getValidToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    console.error('Authentication failed (401). Removing token.');
    localStorage.removeItem('access_token');
    throw new Error('Authentication failed. Please login again.');
  }
  
  if (!response.ok) {
    // Try to get detailed error message from response
    let errorDetail = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || errorData.msg || errorDetail;
      
      // Log additional debug info for 422 errors
      if (response.status === 422) {
        console.error('🔍 422 Validation Error Details:', errorData);
      }
    } catch {
      // If response is not JSON, use status text
      errorDetail = response.statusText || errorDetail;
    }
    
    throw new Error(errorDetail);
  }
  
  return response.json();
};

// Enhanced job transformation that matches your database structure
const transformBackendJob = (backendJob: any, isSaved: boolean = false): Job => {
  // Determine job type from your database fields
  let jobType = JobType.FULL_TIME;
  if (backendJob.remote) {
    jobType = JobType.REMOTE;
  }
  
  // Extract data from raw object if it exists
  const rawData = backendJob.raw || {};
  
  // Get employment type from raw data
  if (rawData.employment_type) {
    const empType = rawData.employment_type.toLowerCase();
    if (empType.includes('part')) jobType = JobType.PART_TIME;
    if (empType.includes('contract')) jobType = JobType.CONTRACT;
    if (empType.includes('freelance')) jobType = JobType.FREELANCE;
    if (empType.includes('intern')) jobType = JobType.INTERNSHIP;
  }

  // Extract skills from matched_skills or other fields
  const requiredSkills = backendJob.matched_skills || 
                        rawData.skills || 
                        rawData.required_skills || 
                        [];

  // Create description from available fields
  const description = backendJob.description || 
                     rawData.description || 
                     rawData.summary || 
                     "No description available";

  // Get salary information
  const salary = rawData.salary || 
                backendJob.salary || 
                "Salary not disclosed";

  // Get location - prefer the main location field
  const location = backendJob.location || 
                  rawData.location || 
                  (backendJob.remote ? 'Remote' : 'Location not specified');

  return {
    id: backendJob.job_id || backendJob._id || `job-${Date.now()}`,
    title: backendJob.title || 'No Title',
    company: backendJob.company_name || 'Unknown Company',
    location: location,
    salary: salary,
    description: description,
    type: jobType,
    postedDate: backendJob.date_posted || new Date().toISOString().split('T')[0],
    deadline: rawData.last_date || rawData.deadline,
    requirements: rawData.requirements || [],
    requiredSkills: requiredSkills,
    tags: requiredSkills,
    isSaved,
    matchScore: backendJob.match_score || Math.floor(Math.random() * 30) + 70,
    remote: backendJob.remote || false,
    applyUrl: backendJob.url || '',
    url: backendJob.url || '',
    savedAt: backendJob.saved_at || null
  };
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      console.log('Login attempt for:', email);
      
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', errorText);
        throw new Error(`Login failed: ${response.status}`);
      }

      const result = await response.json();
      localStorage.setItem('access_token', result.access_token);
      console.log('Login successful, token stored');
      
      return result;
    },

    logout: async (): Promise<void> => {
      localStorage.removeItem('access_token');
      console.log('Logged out and token removed');
    },

    register: async (data: any): Promise<User> => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<User>(response);
    },

    getProfile: async (): Promise<User> => {
      const token = getValidToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse<User>(response);
    },

    updateSkills: async (skills: string[]): Promise<User> => {
      console.log('🔄 Updating skills with:', skills);
      
      // Try different request formats to find what the backend expects
      const requestBodies = [
        { skills }, // Most common format
        { user_skills: skills }, // Alternative format
        { skills: skills.join(',') }, // Comma-separated string
        { skills_list: skills }, // Another alternative
      ];

      let lastError: Error | null = null;

      for (const body of requestBodies) {
        try {
          console.log('🔧 Trying request body:', body);
          const response = await fetch(`${API_BASE_URL}/auth/skills`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body),
          });

          if (response.ok) {
            console.log('✅ Skills update successful with body:', body);
            return handleResponse<User>(response);
          }

          // If not successful, continue to next format
          const errorText = await response.text();
          console.log(`❌ Format failed (${response.status}):`, errorText);
          lastError = new Error(`Failed with format: ${JSON.stringify(body)} - ${errorText}`);

        } catch (error) {
          console.log('❌ Request failed:', error);
          lastError = error as Error;
        }
      }

      // If all formats failed, throw the last error
      throw lastError || new Error('All request formats failed for skills update');
    },

    // Alternative method for updating full profile
    updateProfile: async (profileData: Partial<User>): Promise<User> => {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData),
      });
      return handleResponse<User>(response);
    }
  },

  jobs: {
    getAll: async (query: string = '', filters: any = {}): Promise<Job[]> => {
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('q', query);
      if (filters.location) searchParams.append('location', filters.location);
      
      const response = await fetch(`${API_BASE_URL}/jobs?${searchParams.toString()}`, {
        headers: getHeaders(),
      });
      const backendJobs = await handleResponse<any[]>(response);
      
      return backendJobs.map((job: any) => transformBackendJob(job, false));
    },

    getRecommended: async (): Promise<Job[]> => {
      try {
        const token = getValidToken();
        if (!token) {
          console.error('Cannot fetch recommended jobs: No authentication token');
          return [];
        }
        
        const response = await fetch(`${API_BASE_URL}/recommended-jobs`, {
          headers: getHeaders(),
        });
        
        if (!response.ok) {
          console.error('Recommended jobs fetch failed:', response.status);
          throw new Error(`Failed to fetch recommended jobs: ${response.status}`);
        }
        
        const backendJobs = await handleResponse<any[]>(response);
        console.log('Received recommended jobs from API:', backendJobs.length);
        
        return backendJobs.map((job: any) => transformBackendJob(job, false));
      } catch (error) {
        console.error('Error in getRecommended:', error);
        return [];
      }
    },

    getById: async (id: string): Promise<Job> => {
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        headers: getHeaders(),
      });
      const backendJob = await handleResponse<any>(response);
      
      return transformBackendJob(backendJob, false);
    },

    save: async (id: string): Promise<SaveJobResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/apply/add/${id}`, {
          method: 'POST',
          headers: getHeaders(),
        });
        
        console.log('Save job response status:', response.status);
        
        if (response.status === 409) {
          return { 
            status: 'exists', 
            message: 'Job already saved',
            jobId: id
          };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Save failed:', errorText);
          throw new Error(`Save failed: ${response.status}`);
        }
        
        return { 
          status: 'saved', 
          message: 'Job saved successfully',
          jobId: id
        };
      } catch (error) {
        console.error('Error saving job:', error);
        return { 
          status: 'error', 
          message: 'Failed to save job',
          jobId: id
        };
      }
    },

    unsave: async (id: string): Promise<UnsaveJobResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/apply/remove/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        
        console.log('Unsave job response status:', response.status);
        
        if (response.status === 404) {
          return { 
            status: 'not_found', 
            message: 'Job not found in saved list',
            jobId: id
          };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Unsave failed:', errorText);
          throw new Error(`Unsave failed: ${response.status}`);
        }
        
        return { 
          status: 'removed', 
          message: 'Job removed from saved list',
          jobId: id
        };
      } catch (error) {
        console.error('Error unsaving job:', error);
        return { 
          status: 'error', 
          message: 'Failed to unsave job',
          jobId: id
        };
      }
    },

    getSaved: async (): Promise<Job[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/apply/list`, {
          headers: getHeaders(),
        });
        const data = await handleResponse<any>(response);
        
        // Handle different response formats
        let jobsArray: any[] = [];
        if (Array.isArray(data)) {
          jobsArray = data;
        } else if (data && Array.isArray(data.jobs)) {
          jobsArray = data.jobs;
        } else if (data && Array.isArray(data.apply_later)) {
          jobsArray = data.apply_later;
        } else if (data && Array.isArray(data.saved_jobs)) {
          jobsArray = data.saved_jobs;
        }
        
        return jobsArray.map((job: any) => transformBackendJob(job, true));
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        return [];
      }
    },

    getApplyLater: async (): Promise<Job[]> => {
      return api.jobs.getSaved();
    },

    checkSavedStatus: async (jobId: string): Promise<boolean> => {
      try {
        const response = await fetch(`${API_BASE_URL}/apply/check/${jobId}`, {
          headers: getHeaders(),
        });
        const data = await handleResponse<any>(response);
        return data.is_saved || false;
      } catch (error) {
        console.error('Error checking saved status:', error);
        return false;
      }
    },

    getSavedCount: async (): Promise<number> => {
      try {
        const response = await fetch(`${API_BASE_URL}/apply/count`, {
          headers: getHeaders(),
        });
        const data = await handleResponse<any>(response);
        return data.count || 0;
      } catch (error) {
        console.error('Error fetching saved count:', error);
        return 0;
      }
    },

    fetchJobs: async (): Promise<{status: string; message: string}> => {
      const response = await fetch(`${API_BASE_URL}/jobs/fetch`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse<{status: string; message: string}>(response);
    }
  },

  applications: {
    getAll: async (): Promise<Application[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
          headers: getHeaders(),
        });
        const data = await handleResponse<any[]>(response);
        
        return data.map((app: any) => ({
          id: app.id || app._id || `app-${Date.now()}`,
          jobId: app.job_id,
          userId: app.user_id,
          status: app.status as ApplicationStatus || ApplicationStatus.PENDING,
          appliedDate: app.applied_date || app.created_at || new Date().toISOString(),
          job: {
            id: app.job_id,
            title: app.job?.title || 'Unknown Job',
            company: app.job?.company || 'Unknown Company',
            location: app.job?.location || 'Remote',
            logoUrl: app.job?.logo_url
          }
        }));
      } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
      }
    },

    create: async (jobId: string): Promise<Application> => {
      try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ jobId }),
        });
        
        const data = await handleResponse<any>(response);
        
        return {
          id: data.id || `app-${Date.now()}`,
          jobId: data.job_id || jobId,
          userId: data.user_id || 'current-user',
          status: data.status as ApplicationStatus || ApplicationStatus.PENDING,
          appliedDate: data.applied_date || new Date().toISOString(),
          job: {
            id: data.job?.id || jobId,
            title: data.job?.title || 'Applied Job',
            company: data.job?.company || 'Unknown Company',
            location: data.job?.location || 'Remote',
            logoUrl: data.job?.logo_url
          }
        };
      } catch (error) {
        console.error('Error creating application:', error);
        // Fallback to ensure the app doesn't break
        return {
          id: `app-${Date.now()}`,
          jobId,
          userId: 'current-user',
          status: ApplicationStatus.PENDING,
          appliedDate: new Date().toISOString(),
          job: {
            id: jobId,
            title: 'Applied Job',
            company: 'Unknown Company',
            location: 'Remote'
          }
        };
      }
    },

    updateStatus: async (applicationId: string, status: ApplicationStatus): Promise<Application> => {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse<Application>(response);
    },

    delete: async (applicationId: string): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse<void>(response);
    }
  },

  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      try {
        const [savedJobs, recommendedJobs, savedCount, applications] = await Promise.all([
          api.jobs.getSaved(),
          api.jobs.getRecommended(),
          api.jobs.getSavedCount(),
          api.applications.getAll()
        ]);

        const urgentDeadlineCount = savedJobs.filter(job => {
          try {
            if (!job.deadline) return false;
            const deadline = new Date(job.deadline);
            const now = new Date();
            const diffTime = deadline.getTime() - now.getTime();
            const diffHours = diffTime / (1000 * 60 * 60);
            return diffHours <= 48 && diffHours > 0;
          } catch {
            return false;
          }
        }).length;

        return {
          newMatches: recommendedJobs.length,
          applyLater: savedCount,
          urgentDeadlineCount,
          totalApplications: applications.length,
          profileMatch: 85
        };
      } catch (error) {
        console.error('Error calculating dashboard stats:', error);
        return {
          newMatches: 0,
          applyLater: 0,
          urgentDeadlineCount: 0,
          totalApplications: 0,
          profileMatch: 0
        };
      }
    },

    getNotifications: async (): Promise<Notification[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          headers: getHeaders(),
        });
        const data = await handleResponse<any[]>(response);
        
        return data.map((notif: any) => ({
          id: notif.id || notif._id,
          title: notif.title,
          message: notif.message,
          date: notif.created_at || notif.date,
          read: notif.read || false,
          type: (notif.type as 'info' | 'success' | 'warning' | 'error') || 'info'
        }));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },

    markNotificationAsRead: async (notificationId: string): Promise<void> => {
      try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: getHeaders(),
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    }
  },

  health: {
    check: async (): Promise<HealthCheckResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error(`API health check failed: ${response.status}`);
        }
        return handleResponse<HealthCheckResponse>(response);
      } catch (error) {
        console.error('API health check failed:', error);
        throw error;
      }
    }
  }
};

export default api;