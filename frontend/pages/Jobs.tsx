import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Job, User } from '../types';
import { JobCard } from '../components/JobCard';
import { Search, Filter, SlidersHorizontal, X, Star } from 'lucide-react';

export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Safe API call for user profile - CORRECTED: using auth.getProfile()
  const safeGetUserProfile = async (): Promise<User | null> => {
    try {
      return await api.auth.getProfile();
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return null;
    }
  };

  // Fetch jobs and user data
  const fetchJobs = async (query = '') => {
    setLoading(true);
    try {
      const [jobsData, userData] = await Promise.all([
        api.jobs.getAll(query),
        safeGetUserProfile() // Use the safe function
      ]);
      
      // Calculate skills match for each job
      const jobsWithMatch = jobsData.map(job => ({
        ...job,
        matchScore: calculateSkillsMatch(job, userData?.skills || [])
      }));
      
      setJobs(jobsWithMatch);
      setFilteredJobs(jobsWithMatch);
      setUser(userData || null);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate skills match percentage
  const calculateSkillsMatch = (job: Job, userSkills: string[]): number => {
    if (userSkills.length === 0 || !job.tags || job.tags.length === 0) return 0;
    
    const matchingSkills = job.tags.filter(tag => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    return Math.round((matchingSkills.length / job.tags.length) * 100);
  };

  // Filter jobs locally based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const query = searchTerm.toLowerCase();
      const filtered = jobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.tags && job.tags.some(tag => tag.toLowerCase().includes(query))) ||
        job.description.toLowerCase().includes(query)
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, jobs]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Local filtering is already handled by useEffect, but you can keep this for API search if needed
    console.log('Searching for:', searchTerm);
  };

  const handleApply = async (id: string) => {
    try {
      // Find the job to get its URL
      const job = jobs.find(j => j.id === id);
      
      if (job?.url) {
        // Open the job application URL in new tab
        window.open(job.url, '_blank');
        
        // Show confirmation after a short delay
        setTimeout(() => {
          const userConfirmed = window.confirm(
            `Have you successfully applied to "${job.title}" at ${job.company}?\n\nClick "OK" to track this application.`
          );
          
          if (userConfirmed) {
            // Track the application in your system
            api.applications.create(id);
            alert('Application tracked successfully!');
            
            // Update local state if needed
            setJobs(prev => prev.map(j => 
              j.id === id ? { ...j, isSaved: false } : j
            ));
            setFilteredJobs(prev => prev.map(j => 
              j.id === id ? { ...j, isSaved: false } : j
            ));
          }
        }, 1000);
      } else {
        // Fallback for jobs without URLs
        await api.applications.create(id);
        alert('Application submitted successfully!');
      }
    } catch (e) {
      console.error('Apply error:', e);
      alert('Failed to apply. Please try again.');
    }
  };
  
  const handleSave = async (id: string) => {
    try {
      setSavingJobId(id);
      const result = await api.jobs.save(id);
      if (result.status === 'saved' || result.status === 'exists') {
        setJobs(prev => prev.map(j => j.id === id ? {...j, isSaved: true} : j));
        setFilteredJobs(prev => prev.map(j => j.id === id ? {...j, isSaved: true} : j));
      }
    } catch(e) {
      console.error('Save error:', e);
    } finally {
      setSavingJobId(null);
    }
  }

  const handleUnsave = async (id: string) => {
    try {
      setSavingJobId(id);
      const result = await api.jobs.unsave(id);
      if (result.status === 'removed' || result.status === 'not_found') {
        setJobs(prev => prev.map(j => j.id === id ? {...j, isSaved: false} : j));
        setFilteredJobs(prev => prev.map(j => j.id === id ? {...j, isSaved: false} : j));
      }
    } catch(e) {
      console.error('Unsave error:', e);
    } finally {
      setSavingJobId(null);
    }
  }

  const handleTrackApplication = async (job: Job) => {
    try {
      await api.applications.create(job.id);
      console.log('Application tracked for:', job.title);
      
      // Remove from saved jobs if it was saved
      if (job.isSaved) {
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, isSaved: false } : j
        ));
        setFilteredJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, isSaved: false } : j
        ));
      }
    } catch (error) {
      console.error('Error tracking application:', error);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div>
      {/* Fixed Search Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 sticky top-4 z-10">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search job titles, companies, or keywords..." 
              className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
                filterOpen 
                  ? 'bg-primary-50 border-primary-200 text-primary-700' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <SlidersHorizontal size={20} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button 
              type="submit"
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </form>
        
        {/* Skills Match Info */}
        {user && user.skills && user.skills.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Star size={14} className="text-blue-500" />
            <span>Jobs are scored based on your {user.skills.length} skills</span>
          </div>
        )}
        
        {/* Expandable Filters */}
        {filterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select className="p-2 border rounded-md text-sm text-slate-600 bg-white">
              <option>Experience Level</option>
              <option>Junior</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
            <select className="p-2 border rounded-md text-sm text-slate-600 bg-white">
              <option>Job Type</option>
              <option>Full-time</option>
              <option>Contract</option>
              <option>Remote</option>
            </select>
            <select className="p-2 border rounded-md text-sm text-slate-600 bg-white">
              <option>Salary Range</option>
              <option>$50k - $100k</option>
              <option>$100k - $150k</option>
              <option>$150k+</option>
            </select>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {loading ? 'Searching...' : `Showing ${filteredJobs.length} Jobs`}
          </h2>
          {searchTerm && !loading && (
            <p className="text-sm text-slate-500 mt-1">
              Results for "<span className="font-medium text-slate-700">{searchTerm}</span>"
            </p>
          )}
        </div>
        <span className="text-sm text-slate-500">
          Sorted by: <span className="font-medium text-slate-900">Best Match</span>
        </span>
      </div>

      {/* Job List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           [1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
           ))
        ) : (
          filteredJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              onApply={handleApply} 
              onSave={job.isSaved ? handleUnsave : handleSave}
              onTrackApplication={handleTrackApplication}
              saveLabel={job.isSaved ? "Remove" : "Save for Later"}
              isSaveLoading={savingJobId === job.id}
              userSkills={user?.skills || []}
            />
          ))
        )}
        
        {!loading && filteredJobs.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="text-slate-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              {searchTerm ? 'No jobs found' : 'No jobs available'}
            </h3>
            <p className="text-slate-500 mt-1">
              {searchTerm 
                ? 'Try adjusting your search terms or filters.' 
                : 'Check back later for new job postings.'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};