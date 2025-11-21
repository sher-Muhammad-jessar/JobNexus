import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { Bookmark, Search, Filter } from 'lucide-react';

export const SavedJobs: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      const jobs = await api.jobs.getSaved();
      setSavedJobs(jobs);
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string) => {
    try {
      const job = savedJobs.find(j => j.id === id);
      
      if (job?.applyUrl) {
        window.open(job.applyUrl, '_blank');
        
        setTimeout(() => {
          const userConfirmed = window.confirm(
            `Have you successfully applied to "${job.title}" at ${job.company}?\n\nClick "OK" to track this application.`
          );
          
          if (userConfirmed) {
            api.applications.create(id);
            alert('Application tracked successfully!');
            // Remove from saved jobs after applying
            setSavedJobs(prev => prev.filter(j => j.id !== id));
          }
        }, 1000);
      } else {
        await api.applications.create(id);
        alert('Application submitted successfully!');
        // Remove from saved jobs after applying
        setSavedJobs(prev => prev.filter(j => j.id !== id));
      }
    } catch (e) {
      console.error("Failed to apply", e);
      alert("Failed to apply. Please try again.");
    }
  };

  const handleUnsaveJob = async (id: string) => {
    try {
      setSavingJobId(id);
      await api.jobs.unsave(id);
      // Remove from local state
      setSavedJobs(prev => prev.filter(j => j.id !== id));
    } catch (e) {
      console.error("Failed to unsave job", e);
      alert("Failed to remove job. Please try again.");
    } finally {
      setSavingJobId(null);
    }
  };

  const handleTrackApplication = (job: Job) => {
    console.log('Tracking application for:', job.title);
  };

  const filteredJobs = savedJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.requiredSkills && job.requiredSkills.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // Calculate stats safely
  const totalSaved = savedJobs.length;
  const activeListings = savedJobs.filter(job => 
    job.deadline && new Date(job.deadline) > new Date()
  ).length;
  const highMatch = savedJobs.filter(job => 
    job.matchScore && job.matchScore > 80
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bookmark className="text-blue-600" size={32} />
                <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Jobs you have saved for later review
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search saved jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm">
                <Filter size={20} className="text-gray-600" />
                <span className="text-gray-700 font-medium hidden sm:block">Filters</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{totalSaved}</div>
              <div className="text-gray-600 text-sm">Total Saved</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">{activeListings}</div>
              <div className="text-gray-600 text-sm">Active Listings</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{highMatch}</div>
              <div className="text-gray-600 text-sm">High Match</div>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No matching saved jobs' : 'No saved jobs yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'Save jobs from the recommendations to apply to them later.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApply={handleApply}
                    onSave={handleUnsaveJob}
                    onTrackApplication={handleTrackApplication}
                    saveLabel="Remove"
                    isSaveLoading={savingJobId === job.id}
                    userSkills={[]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};