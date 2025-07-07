import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Brief, BriefStage } from '../../types';
import { X, Plus, Trash2, Calendar, DollarSign, Clock, User } from 'lucide-react';
import { capitalizeWords } from '../../lib/capitalizeWords';

interface BriefCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BriefCreationModal: React.FC<BriefCreationModalProps> = ({ isOpen, onClose }) => {
  const { clients, staff, addBrief, addNotification, loading, error, clearError } = useApp();
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    workType: 'photography' as 'photography' | 'videography' | 'design' | 'marketing',
    projectValue: 0,
    poNumber: '',
    dueDate: '',
    estimatedHours: {
      shoot: 0,
      edit: 0
    },
    template: 'standard',
    isRecurring: false,
    recurrencePattern: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly',
    assignedStaff: [] as string[],
    deliverables: [
      {
        title: '',
        type: 'photo' as 'photo' | 'video' | 'design' | 'document',
        dueDate: ''
      }
    ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workTypeTemplates = {
    photography: {
      deliverables: [
        { title: 'Raw Photos', type: 'photo' as const },
        { title: 'Edited Photos', type: 'photo' as const },
        { title: 'Final Gallery', type: 'photo' as const }
      ],
      estimatedHours: { shoot: 8, edit: 12 }
    },
    videography: {
      deliverables: [
        { title: 'Raw Footage', type: 'video' as const },
        { title: 'Rough Cut', type: 'video' as const },
        { title: 'Final Video', type: 'video' as const }
      ],
      estimatedHours: { shoot: 12, edit: 24 }
    },
    design: {
      deliverables: [
        { title: 'Initial Concepts', type: 'design' as const },
        { title: 'Design Revisions', type: 'design' as const },
        { title: 'Final Assets', type: 'design' as const }
      ],
      estimatedHours: { shoot: 0, edit: 20 }
    },
    marketing: {
      deliverables: [
        { title: 'Strategy Document', type: 'document' as const },
        { title: 'Campaign Assets', type: 'design' as const },
        { title: 'Performance Report', type: 'document' as const }
      ],
      estimatedHours: { shoot: 0, edit: 30 }
    }
  };

  const handleWorkTypeChange = (workType: typeof formData.workType) => {
    const template = workTypeTemplates[workType];
    setFormData(prev => ({
      ...prev,
      workType,
      estimatedHours: template.estimatedHours,
      deliverables: template.deliverables.map(d => ({
        ...d,
        dueDate: prev.dueDate
      }))
    }));
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [
        ...prev.deliverables,
        {
          title: '',
          type: 'photo',
          dueDate: prev.dueDate
        }
      ]
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const updateDeliverable = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.projectValue <= 0) newErrors.projectValue = 'Project value must be greater than 0';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (formData.deliverables.some(d => !d.title.trim())) {
      newErrors.deliverables = 'All deliverables must have titles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;

    setIsSubmitting(true);
    try {
      // Create the brief
      const briefData: Omit<Brief, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: formData.clientId,
        title: formData.title,
        workType: formData.workType,
        projectValue: formData.projectValue,
        poNumber: formData.poNumber || undefined,
        dueDate: new Date(formData.dueDate),
        deliverables: formData.deliverables.map((d, index) => ({
          id: `d-${Date.now()}-${index}`,
          briefId: '', // Will be set by addBrief
          title: d.title,
          type: d.type,
          status: 'pending' as const,
          dueDate: new Date(d.dueDate || formData.dueDate),
          tasks: []
        })),
        estimatedHours: formData.estimatedHours,
        template: formData.template,
        stage: 'incoming' as BriefStage,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : undefined,
        assignedStaff: formData.assignedStaff,
        reviewUrls: {}
      };

      await addBrief(briefData);

      // Add notification for assigned staff
      if (formData.assignedStaff.length > 0) {
        formData.assignedStaff.forEach(staffId => {
          addNotification({
            userId: staffId,
            title: 'New Brief Assigned',
            message: `You've been assigned to "${formData.title}" for ${client.name}`,
            type: 'info',
            read: false,
            actionUrl: '/briefs'
          });
        });
      }

      // Add admin notification
      addNotification({
        userId: '1', // Admin
        title: 'New Brief Created',
        message: `"${formData.title}" has been created for ${client.name}`,
        type: 'success',
        read: false,
        actionUrl: '/briefs'
      });

      onClose();
      
      // Reset form
      setFormData({
        clientId: '',
        title: '',
        workType: 'photography',
        projectValue: 0,
        poNumber: '',
        dueDate: '',
        estimatedHours: { shoot: 0, edit: 0 },
        template: 'standard',
        isRecurring: false,
        recurrencePattern: 'monthly',
        assignedStaff: [],
        deliverables: [{ title: '', type: 'photo', dueDate: '' }]
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to create brief:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">Create New Brief</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={`input ${errors.clientId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.type})
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Type *
              </label>
              <select
                value={formData.workType}
                onChange={(e) => handleWorkTypeChange(e.target.value as typeof formData.workType)}
                className="input"
                disabled={isSubmitting}
              >
                <option value="photography">Photography</option>
                <option value="videography">Videography</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brief Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Q1 Product Launch Campaign"
              className={`input ${errors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Project Value (£) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: Number(e.target.value) })}
                className={`input ${errors.projectValue ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.projectValue && <p className="text-red-500 text-xs mt-1">{errors.projectValue}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Number
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="Optional"
                className="input"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`input ${errors.dueDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Shoot Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedHours.shoot}
                onChange={(e) => setFormData({
                  ...formData,
                  estimatedHours: { ...formData.estimatedHours, shoot: Number(e.target.value) }
                })}
                className="input"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Edit Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedHours.edit}
                onChange={(e) => setFormData({
                  ...formData,
                  estimatedHours: { ...formData.estimatedHours, edit: Number(e.target.value) }
                })}
                className="input"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Staff Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <User className="inline h-4 w-4 mr-1" />
              Assign Staff
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {staff.map(member => (
                <label key={member.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.assignedStaff.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          assignedStaff: [...formData.assignedStaff, member.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          assignedStaff: formData.assignedStaff.filter(id => id !== member.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    disabled={isSubmitting}
                  />
                  <img
                    src={member.avatar}
                    alt={capitalizeWords(member.name)}
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{capitalizeWords(member.name)}</p>
                    <p className="text-xs text-gray-500">{member.skills.join(', ')}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Deliverables
              </label>
              <button
                type="button"
                onClick={addDeliverable}
                className="btn-ghost text-sm"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Deliverable
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    value={deliverable.title}
                    onChange={(e) => updateDeliverable(index, 'title', e.target.value)}
                    placeholder="Deliverable title"
                    className="flex-1 input"
                    disabled={isSubmitting}
                  />
                  <select
                    value={deliverable.type}
                    onChange={(e) => updateDeliverable(index, 'type', e.target.value)}
                    className="input w-32"
                    disabled={isSubmitting}
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="design">Design</option>
                    <option value="document">Document</option>
                  </select>
                  <input
                    type="date"
                    value={deliverable.dueDate}
                    onChange={(e) => updateDeliverable(index, 'dueDate', e.target.value)}
                    className="input w-40"
                    disabled={isSubmitting}
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.deliverables && <p className="text-red-500 text-xs mt-1">{errors.deliverables}</p>}
          </div>

          {/* Recurring Options */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                disabled={isSubmitting}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                Recurring Brief
              </label>
            </div>
            
            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence Pattern
                </label>
                <select
                  value={formData.recurrencePattern}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recurrencePattern: e.target.value as typeof formData.recurrencePattern 
                  })}
                  className="input"
                  disabled={isSubmitting}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
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
                  Creating...
                </span>
              ) : (
                'Create Brief'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BriefCreationModal;