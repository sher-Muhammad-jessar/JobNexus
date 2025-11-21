import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User as UserIcon, Mail, Briefcase, Award, Save, Camera, Edit3, MapPin, Phone, Globe } from 'lucide-react';
import { User } from '../types';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    skills: ''
  });

  // Helper function to safely get user fields
  const getUserField = (field: keyof User): string => {
    return (user as any)?.[field] || '';
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        title: getUserField('title'),
        email: user.email || '',
        bio: getUserField('bio'),
        location: getUserField('location'),
        phone: getUserField('phone'),
        website: getUserField('website'),
        skills: user.skills?.join(', ') || ''
      });
    }
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      updateUser({ avatar: imageUrl });
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Process skills
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      
      if (skillsArray.length === 0) {
        alert('Please add at least one skill');
        setLoading(false);
        return;
      }

      // Update skills via API
      await api.auth.updateSkills(skillsArray);
      
      // Update the user in context with all form data
      updateUser({
        name: formData.name,
        title: formData.title,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        skills: skillsArray,
        profileCompletion: 100
      });
      
      setIsEditing(false);
      alert("Profile Updated Successfully!");
      
    } catch (error: any) {
      console.error('Profile update failed:', error);
      
      // More specific error messages
      if (error.message?.includes('422')) {
        alert('Invalid data format. Please check that you have entered valid information.');
      } else if (error.message?.includes('401')) {
        alert('Session expired. Please log in again.');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          {isEditing && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute top-4 right-4 bg-white/90 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Camera size={16} />
              {uploading ? 'Uploading...' : 'Change Cover'}
            </button>
          )}
        </div>
        
        <div className="px-6 sm:px-8 pb-8">
          {/* Profile Header */}
          <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="flex items-end">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="w-full h-full rounded-2xl object-cover" 
                    />
                  ) : (
                    <UserIcon size={40} className="text-blue-600" />
                  )}
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>
              
              <div className="ml-6 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-transparent border-b-2 border-blue-500 outline-none"
                      placeholder="Your Name"
                    />
                  ) : (
                    user.name
                  )}
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="bg-transparent border-b-2 border-blue-500 outline-none w-64"
                      placeholder="Your Job Title"
                    />
                  ) : (
                    getUserField('title') || 'Add your professional title'
                  )}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => isEditing ? handleSubmit({ preventDefault: () => {} } as React.FormEvent) : setIsEditing(true)}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </>
              ) : (
                <>
                  <Edit3 size={18} />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-8 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
                    <div className="relative">
                      <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g. Senior Frontend Developer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Contact Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="tel" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website/Portfolio</label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="url" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio and Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
                  <textarea 
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about your professional background, experience, and career goals..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills <span className="text-red-500">*</span> (comma separated)
                  </label>
                  <div className="relative">
                    <Award size={18} className="absolute left-3 top-3 text-gray-400" />
                    <textarea 
                      className="w-full h-32 pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      value={formData.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      placeholder="React, JavaScript, Python, Node.js, UI/UX Design..."
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Separate multiple skills with commas. These are used for job recommendations.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={loading || !formData.skills.trim()}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} /> 
                  {loading ? 'Updating Profile...' : 'Save All Changes'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Personal Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserIcon size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{user.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Professional Title</p>
                      <p className="font-medium">{getUserField('title') || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{getUserField('location') || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{getUserField('phone') || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <p className="font-medium">{getUserField('website') || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio and Skills */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Professional Details</h3>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Bio</p>
                  <p className="text-gray-700">
                    {getUserField('bio') || 'No bio provided yet.'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No skills added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};