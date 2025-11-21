import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Application, ApplicationStatus } from '../types';
import { CheckCircle2, Clock, XCircle, Calendar, MoreHorizontal, Eye, Send } from 'lucide-react';

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const styles = {
    [ApplicationStatus.PENDING]: 'bg-blue-100 text-blue-700 border-blue-200',
    [ApplicationStatus.APPLIED]: 'bg-purple-100 text-purple-700 border-purple-200',
    [ApplicationStatus.UNDER_REVIEW]: 'bg-amber-100 text-amber-700 border-amber-200',
    [ApplicationStatus.INTERVIEW]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [ApplicationStatus.OFFER]: 'bg-green-100 text-green-700 border-green-200',
    [ApplicationStatus.ACCEPTED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
  };

  const icons = {
    [ApplicationStatus.PENDING]: Clock,
    [ApplicationStatus.APPLIED]: Send,
    [ApplicationStatus.UNDER_REVIEW]: Eye,
    [ApplicationStatus.INTERVIEW]: Calendar,
    [ApplicationStatus.OFFER]: CheckCircle2,
    [ApplicationStatus.ACCEPTED]: CheckCircle2,
    [ApplicationStatus.REJECTED]: XCircle,
  };
  
  const Icon = icons[status] || Clock;
  
  // Format status text for display
  const getStatusText = (status: ApplicationStatus): string => {
    const statusMap = {
      [ApplicationStatus.PENDING]: 'Pending',
      [ApplicationStatus.APPLIED]: 'Applied',
      [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
      [ApplicationStatus.INTERVIEW]: 'Interview',
      [ApplicationStatus.OFFER]: 'Offer',
      [ApplicationStatus.ACCEPTED]: 'Accepted',
      [ApplicationStatus.REJECTED]: 'Rejected',
    };
    return statusMap[status] || status;
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <Icon size={12} className="mr-1.5" />
      {getStatusText(status)}
    </span>
  );
};

export const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await api.applications.getAll();
        setApplications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Track Applications</h2>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile List View */}
        <div className="block md:hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No applications yet. Start applying!</div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-4 border-b border-slate-100 last:border-none">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                      {app.job.logoUrl ? (
                        <img src={app.job.logoUrl} alt={app.job.company} className="w-full h-full object-cover rounded-md"/>
                      ) : (
                        <span className="text-slate-600 font-semibold text-sm">
                          {app.job.company.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{app.job.title}</h4>
                      <p className="text-xs text-slate-500">{app.job.company}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-slate-400">
                    Applied: {new Date(app.appliedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Company / Role</th>
                <th className="px-6 py-4">Date Applied</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No applications yet. Start applying!
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1">
                            {app.job.logoUrl ? (
                              <img src={app.job.logoUrl} alt={app.job.company} className="rounded" />
                            ) : (
                              <span className="text-xs font-bold text-slate-600">
                                {app.job.company.charAt(0).toUpperCase()}
                              </span>
                            )}
                         </div>
                         <div>
                           <p className="font-semibold text-slate-900 text-sm">{app.job.title}</p>
                           <p className="text-xs text-slate-500">{app.job.company}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(app.appliedDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-slate-400 hover:text-slate-600 transition-colors">
                         <MoreHorizontal size={20} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};