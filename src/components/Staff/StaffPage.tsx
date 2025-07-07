import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSupabase } from '../../context/SupabaseContext';
import { Staff } from '../../types';
import { 
  Plus, Search, Filter, Edit, Trash2, Calendar, 
  DollarSign, Clock, Star, Mail, Phone, AlertTriangle, Users, User
} from 'lucide-react';
import { capitalizeWords } from '../../lib/capitalizeWords';

const StaffPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { supabase } = useSupabase();
  const { staff, briefs, addStaff, updateStaff, deleteStaff, loading, error, clearError } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const allSkills = Array.from(new Set(staff.flatMap(s => s.skills)));

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = filterSkill === 'all' || member.skills.includes(filterSkill);
    return matchesSearch && matchesSkill;
  });

  // Helper to calculate dynamic available hours for a staff member
  const getDynamicAvailableHours = (member: Staff): number => {
    // Calculate hours from calendar entries (all time, not just current month)
    let bookedHours = 0;
    if (member.calendar && Array.isArray(member.calendar)) {
      bookedHours = member.calendar.reduce((sum, entry) => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = new Date(entry.endTime);
        const duration = (entryEnd.getTime() - entryStart.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
    }
    
    // Calculate hours from ALL assigned briefs (not just current month)
    const assignedBriefsHours = briefs
      .filter((b: any) => b.assignedStaff?.includes(member.id))
      .reduce((sum: number, brief: any) => {
        const shootHours = brief.estimatedHours?.shoot || 0;
        const editHours = brief.estimatedHours?.edit || 0;
        return sum + shootHours + editHours;
      }, 0);
    
    const totalBookedHours = bookedHours + assignedBriefsHours;
    return Math.max(0, member.monthlyAvailableHours - totalBookedHours);
  };

  const handleDeleteStaff = async (member: Staff) => {
    try {
      await deleteStaff(member.id);
      setDeletingStaff(null);
    } catch (error) {
      console.error('Failed to delete staff member:', error);
    }
  };

  const StaffCard: React.FC<{ member: Staff }> = ({ member }) => {
    const dynamicAvailableHours = getDynamicAvailableHours(member);
    const totalBookedHours = member.monthlyAvailableHours - dynamicAvailableHours;
    
    return (
      <div className="card card-hover p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={member.avatar}
              alt={member.name}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{capitalizeWords(member.name)}</h3>
              <p className="text-sm text-gray-600 capitalize">{member.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingStaff(member)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setDeletingStaff(member)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{member.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>£{member.hourlyRate}/hour</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="flex flex-col">
              <span className={`font-medium ${dynamicAvailableHours < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {dynamicAvailableHours < 0 ? `${Math.abs(dynamicAvailableHours)}h overbooked` : `${dynamicAvailableHours}h available`}
              </span>
              <span className="text-xs text-gray-500">
                {totalBookedHours}h assigned of {member.monthlyAvailableHours}h capacity
              </span>
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-1">
            {member.skills.map(skill => (
              <span
                key={skill}
                className="badge badge-neutral"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const StaffModal: React.FC<{ member?: Staff; onClose: () => void }> = ({ member, onClose }) => {
    const [formData, setFormData] = useState({
      name: member?.name || '',
      email: member?.email || '',
      hourlyRate: member?.hourlyRate || 75,
      monthlyAvailableHours: member?.monthlyAvailableHours || 160,
      skills: member?.skills || [],
      avatar: member?.avatar || ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(member?.avatar || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
          return;
        }
        if (file.size > 1 * 1024 * 1024) {
          alert('File size must be less than 1MB');
          return;
        }
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    };

    const uploadAvatar = async (file: File): Promise<string> => {
      if (!supabase) throw new Error('Supabase client not available');
      // Convert file to base64 for storage in database
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setUploadingAvatar(true);
      try {
        let avatarUrl = formData.avatar;
        if (selectedFile) {
          avatarUrl = await uploadAvatar(selectedFile);
        }
        if (member) {
          await updateStaff(member.id, {
            ...formData,
            role: 'staff',
            calendar: member.calendar,
            avatar: avatarUrl
          });
        } else {
          await addStaff({
            ...formData,
            role: 'staff',
            calendar: [],
            avatar: avatarUrl
          });
        }
        onClose();
      } catch (error) {
        console.error('Failed to save staff member:', error);
      } finally {
        setIsSubmitting(false);
        setUploadingAvatar(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {member ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="input"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.monthlyAvailableHours}
                    onChange={(e) => setFormData({ ...formData, monthlyAvailableHours: Number(e.target.value) })}
                    className="input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="input"
                  disabled={isSubmitting || uploadingAvatar}
                />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover mt-2"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      {member ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    `${member ? 'Update' : 'Add'} Staff Member`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ProfileModal: React.FC<{ user: any; onClose: () => void }> = ({ user, onClose }) => {
    const [formData, setFormData] = useState({
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user.avatar || '');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
          return;
        }
        
        // Validate file size (1MB limit for database storage)
        if (file.size > 1 * 1024 * 1024) {
          alert('File size must be less than 1MB');
          return;
        }
        
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    };

    const uploadAvatar = async (file: File): Promise<string> => {
      if (!supabase) throw new Error('Supabase client not available');
      
      // Convert file to base64 for storage in database
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setUploadingAvatar(true);
      
      try {
        let avatarUrl = formData.avatar;
        
        // Upload new avatar if file is selected
        if (selectedFile) {
          try {
            avatarUrl = await uploadAvatar(selectedFile);
          } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload profile picture. Please try again.');
            setUploadingAvatar(false);
            setIsSubmitting(false);
            return;
          }
        }

        // Update profile in profiles table
        if (supabase) {
          console.log('Updating profile with data:', {
            name: formData.name,
            email: formData.email,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          });
          
          const { error } = await supabase
            .from('profiles')
            .update({
              name: formData.name,
              email: formData.email,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
          } else {
            console.log('Profile updated successfully, refreshing user...');
            alert('Profile updated successfully!');
            // Refresh user data to update UI
            await refreshUser();
            console.log('User refresh completed');
            onClose();
          }
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      } finally {
        setIsSubmitting(false);
        setUploadingAvatar(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Your Profile</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                
                {/* Current Avatar Preview */}
                {previewUrl && (
                  <div className="mb-3">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
                
                {/* File Upload */}
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition-colors"
                  >
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                    {uploadingAvatar ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {selectedFile ? 'Change Picture' : 'Upload Picture'}
                      </span>
                    )}
                  </label>
                  
                  {selectedFile && (
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 1MB
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal: React.FC<{ member: Staff; onClose: () => void }> = ({ member, onClose }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await handleDeleteStaff(member);
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Delete Staff Member</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{capitalizeWords(member.name)}</strong>? This action cannot be undone and will remove all associated data.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md transition-colors ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                }`}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete Staff Member'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
          <p className="text-gray-600">Manage your team members and their schedules</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 w-full sm:w-64 transition-colors"
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="input"
              disabled={loading}
            >
              <option value="all">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center">
            <svg className="animate-spin h-8 w-8 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-gray-600">Loading staff...</span>
          </div>
        </div>
      )}

      {/* Current User Profile Section */}
      {!loading && user && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Profile
            </h2>
            <button
              onClick={() => setShowProfileModal(true)}
              className="btn-primary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=64`}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{capitalizeWords(user.name)}</h3>
                <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span className="capitalize">{user.role}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Member since {user.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStaff.map(member => (
            <StaffCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {!loading && filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterSkill !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first staff member.'
            }
          </p>
          {!searchTerm && filterSkill === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Staff Member
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <StaffModal onClose={() => setShowAddModal(false)} />
      )}
      
      {editingStaff && (
        <StaffModal 
          member={editingStaff} 
          onClose={() => setEditingStaff(null)} 
        />
      )}

      {deletingStaff && (
        <DeleteConfirmationModal
          member={deletingStaff}
          onClose={() => setDeletingStaff(null)}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
};

export default StaffPage;