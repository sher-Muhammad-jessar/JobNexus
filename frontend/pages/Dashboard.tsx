import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats, Job, User } from '../types';
import { JobCard } from '../components/JobCard';
import { 
  Briefcase, 
  Bookmark, 
  Send, 
  Star, 
  ArrowRight, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Target,
  BookmarkCheck,
  Users,
  TrendingUp
} from 'lucide-react';

const DashboardStatCard = ({ 
  label, 
  value, 
  subtext, 
  icon: Icon, 
  iconColor, 
  bgIconColor 
}: { 
  label: string; 
  value: string | number; 
  subtext: string; 
  icon: any; 
  iconColor: string;
  bgIconColor: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgIconColor}`}>
        <Icon size={24} className={iconColor} />
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
        subtext.includes('+') ? 'bg-green-50 text-green-600' : 
        subtext.includes('urgent') ? 'bg-orange-50 text-orange-600' :
        'bg-gray-50 text-gray-500'
      }`}>
        {subtext}
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'recommended' | 'saved'>('recommended');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [userData, statsData, recJobs, savedJobsData] = await Promise.all([
        api.auth.getProfile(),
        api.dashboard.getStats(),
        api.jobs.getRecommended(),
        api.jobs.getSaved()
      ]);
      setUser(userData);
      setStats(statsData);
      setRecommendedJobs(recJobs);
      setSavedJobs(savedJobsData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter jobs based on search term
  const filteredRecommendedJobs = recommendedJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSavedJobs = savedJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayJobs = activeTab === 'recommended' ? filteredRecommendedJobs : filteredSavedJobs;

  const handleSaveJob = async (id: string) => {
    try {
      setSavingJobId(id);
      await api.jobs.save(id);
      // Reload saved jobs to reflect changes
      const updatedSavedJobs = await api.jobs.getSaved();
      setSavedJobs(updatedSavedJobs);
      // Update the recommended job to show as saved
      setRecommendedJobs(prev => prev.map(job => 
        job.id === id ? { ...job, isSaved: true } : job
      ));
      // Update stats
      const newStats = await api.dashboard.getStats();
      setStats(newStats);
    } catch (e) {
      console.error("Failed to save job", e);
      alert("Failed to save job. Please try again.");
    } finally {
      setSavingJobId(null);
    }
  };

  const handleUnsaveJob = async (id: string) => {
    try {
      setSavingJobId(id);
      await api.jobs.unsave(id);
      // Reload saved jobs to reflect changes
      const updatedSavedJobs = await api.jobs.getSaved();
      setSavedJobs(updatedSavedJobs);
      // Update the recommended job to show as unsaved
      setRecommendedJobs(prev => prev.map(job => 
        job.id === id ? { ...job, isSaved: false } : job
      ));
      // Update stats
      const newStats = await api.dashboard.getStats();
      setStats(newStats);
    } catch (e) {
      console.error("Failed to unsave job", e);
      alert("Failed to remove job. Please try again.");
    } finally {
      setSavingJobId(null);
    }
  };

  const handleApply = async (id: string) => {
    try {
      const job = [...recommendedJobs, ...savedJobs].find(j => j.id === id);
      
      if (job?.applyUrl) {
        window.open(job.applyUrl, '_blank');
        
        setTimeout(() => {
          const userConfirmed = window.confirm(
            `Have you successfully applied to "${job.title}" at ${job.company}?\n\nClick "OK" to track this application.`
          );
          
          if (userConfirmed) {
            api.applications.create(id);
            alert('Application tracked successfully!');
            
            // Remove from saved jobs if it was there
            if (savedJobs.find(j => j.id === id)) {
              setSavedJobs(prev => prev.filter(j => j.id !== id));
            }
          }
        }, 1000);
      } else {
        await api.applications.create(id);
        alert('Application submitted successfully!');
        
        // Remove from saved jobs if it was there
        if (savedJobs.find(j => j.id === id)) {
          setSavedJobs(prev => prev.filter(j => j.id !== id));
        }
      }
    } catch (e) {
      console.error("Failed to apply", e);
      alert("Failed to apply. Please try again.");
    }
  };

  const handleTrackApplication = (job: Job) => {
    console.log('Tracking application for:', job.title);
    // Additional tracking logic can be added here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            </div>
            
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
            </div>
            
            {/* Jobs Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-blue-600">{user?.name?.split(' ')[0] || 'there'}!</span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Here are your personalized job recommendations
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardStatCard 
              label="New Matches" 
              value={stats?.newMatches || 0} 
              subtext="+12%" 
              icon={Target} 
              iconColor="text-blue-600"
              bgIconColor="bg-blue-50"
            />
            <DashboardStatCard 
              label="Apply Later" 
              value={stats?.applyLater || 0} 
              subtext={`${stats?.urgentDeadlineCount || 0} urgent`} 
              icon={Bookmark} 
              iconColor="text-orange-500"
              bgIconColor="bg-orange-50"
            />
            <DashboardStatCard 
              label="Applications" 
              value={stats?.totalApplications || 0} 
              subtext="Active" 
              icon={Send} 
              iconColor="text-green-600"
              bgIconColor="bg-green-50"
            />
            <DashboardStatCard 
              label="Profile Match" 
              value={`${stats?.profileMatch || 0}%`} 
              subtext="+3%" 
              icon={Star} 
              iconColor="text-purple-600"
              bgIconColor="bg-purple-50"
            />
          </div>

          {/* Urgent Deadline Banner */}
          {(stats?.urgentDeadlineCount || 0) > 0 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Urgent Deadlines</h3>
                    <p className="text-orange-100 text-sm">
                      You have {stats?.urgentDeadlineCount} saved jobs closing within 48 hours. Apply now before it's too late.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('saved')}
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
                >
                  <Clock size={16} />
                  View Apply Later
                </button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-white opacity-10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-40 h-40 bg-white opacity-10 rounded-full blur-xl"></div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('recommended')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === 'recommended'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Target size={18} />
                  Recommended Jobs
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                    {filteredRecommendedJobs.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === 'saved'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BookmarkCheck size={18} />
                  Apply Later
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                    {filteredSavedJobs.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'recommended' ? 'Recommended for You' : 'Jobs to Apply Later'}
                  </h2>
                  <p className="text-gray-600">
                    {activeTab === 'recommended' 
                      ? `Based on your profile and resume • ${filteredRecommendedJobs.length} jobs found` 
                      : `${filteredSavedJobs.length} jobs saved for later review`}
                  </p>
                </div>
                {activeTab === 'recommended' && filteredRecommendedJobs.length > 0 && (
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    View all recommendations
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {/* Jobs Grid - Changed to 2 columns */}
              {displayJobs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  {activeTab === 'recommended' ? (
                    <>
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="text-gray-400" size={24} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchTerm 
                          ? 'Try adjusting your search terms or check back later for new recommendations.'
                          : 'Complete your profile and skills to get personalized job matches.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bookmark className="text-gray-400" size={24} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
                      <p className="text-gray-500">
                        Save jobs from the recommendations to apply to them later.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onApply={handleApply}
                      onSave={job.isSaved ? handleUnsaveJob : handleSaveJob}
                      onTrackApplication={handleTrackApplication}
                      saveLabel={job.isSaved ? "Remove" : "Apply Later"}
                      isSaveLoading={savingJobId === job.id}
                      userSkills={user?.skills || []}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};