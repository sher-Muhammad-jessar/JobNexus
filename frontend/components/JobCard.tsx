import React, { useState } from 'react';
import { Job, JobType } from '../types';
import { MapPin, Clock, Bookmark, ExternalLink, Star, Loader2, Calendar, Building2, Briefcase } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onApply: (id: string) => void;
  onSave: (id: string) => void;
  onTrackApplication: (job: Job) => void;
  saveLabel?: string;
  isSaveLoading?: boolean;
  userSkills?: string[];
}

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onApply, 
  onSave, 
  onTrackApplication,
  saveLabel = "Save for Later",
  isSaveLoading = false,
  userSkills = []
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const isSaved = job.isSaved || saveLabel === "Remove";

  // Calculate skills match
  const calculateSkillsMatch = (): number => {
    if (job.matchScore) return job.matchScore;
    
    if (userSkills.length === 0 || job.requiredSkills.length === 0) return 0;
    
    const matchingSkills = job.requiredSkills.filter(tag => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    return Math.round((matchingSkills.length / job.requiredSkills.length) * 100);
  };

  const matchScore = calculateSkillsMatch();

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (job.applyUrl) {
      window.open(job.applyUrl, '_blank');
      
      setIsApplying(true);
      setTimeout(() => {
        const userConfirmed = window.confirm(
          `Have you successfully applied to "${job.title}" at ${job.company}?\n\nClick "OK" to track this application in your dashboard.`
        );
        
        if (userConfirmed) {
          onTrackApplication(job);
          onApply(job.id);
        }
        setIsApplying(false);
      }, 1500);
    } else {
      onTrackApplication(job);
      onApply(job.id);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(job.id);
  };

  const getJobTypeColor = (type: JobType) => {
    const colors = {
      [JobType.FULL_TIME]: 'bg-green-50 text-green-700 border-green-200',
      [JobType.PART_TIME]: 'bg-blue-50 text-blue-700 border-blue-200',
      [JobType.CONTRACT]: 'bg-purple-50 text-purple-700 border-purple-200',
      [JobType.FREELANCE]: 'bg-amber-50 text-amber-700 border-amber-200',
      [JobType.REMOTE]: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      [JobType.INTERNSHIP]: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isUrgent = job.deadline && new Date(job.deadline) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  const getSalaryDisplay = (salary: string) => {
    if (!salary || salary === 'Not specified') return 'Salary not disclosed';
    return salary;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        {/* Header Section - More Compact */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-gray-700 font-medium text-sm line-clamp-1">{job.company}</p>
              </div>
            </div>
          </div>
          
          {/* Skills Match Badge */}
          <div className="flex flex-col items-end flex-shrink-0 ml-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              matchScore >= 80 ? 'bg-green-50 text-green-700 border border-green-200' :
              matchScore >= 60 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              <Star size={12} className="fill-current" />
              {matchScore}%
            </div>
          </div>
        </div>

        {/* Meta Information - Single Row */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase size={12} className="text-gray-400 flex-shrink-0" />
            <span className={`px-2 py-0.5 rounded-full font-medium border ${getJobTypeColor(job.type)}`}>
              {job.type.replace('_', ' ')}
            </span>
          </div>
          {job.remote && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
              Remote
            </span>
          )}
        </div>

        {/* Salary and Date - Single Row */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs">
            <span className="text-gray-500">Salary: </span>
            <span className="text-gray-800 font-semibold">
              {getSalaryDisplay(job.salary || 'Not specified')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={12} className="text-gray-400" />
            <span>Posted {formatDate(job.postedDate)}</span>
          </div>
        </div>

        {/* Skills Tags - More Compact */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-200"
                >
                  {skill}
                </span>
              ))}
              {job.requiredSkills.length > 3 && (
                <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                  +{job.requiredSkills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description Preview - Shorter */}
        {job.description && job.description !== "No description available" && (
          <div className="mb-3 flex-1">
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
              {job.description}
            </p>
          </div>
        )}

        {/* Deadline Warning - More Compact */}
        {isUrgent && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-xs font-medium">
                Apply before {formatDate(job.deadline!)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons - More Compact */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleApplyClick}
            disabled={isSaveLoading || isApplying}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isApplying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <ExternalLink size={14} />
                Apply Now
              </>
            )}
          </button>
          
          <button
            onClick={handleSaveClick}
            disabled={isSaveLoading || isApplying}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all border disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] ${
              isSaved
                ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow'
            }`}
          >
            {isSaveLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
            )}
            {isSaveLoading ? 'Saving...' : saveLabel}
          </button>
        </div>

        {/* External Link - More Compact */}
        {job.applyUrl && (
          <div className="pt-2 mt-2 border-t border-gray-100">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs transition-colors"
            >
              <ExternalLink size={10} />
              View original posting
            </a>
          </div>
        )}
      </div>
    </div>
  );
};