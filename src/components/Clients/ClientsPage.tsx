import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import RetainerBillingSetup from './RetainerBillingSetup';
import { 
  Plus, Search, Filter, Edit, Trash2, MessageCircle, 
  Building, Mail, Phone, Calendar, DollarSign, AlertTriangle, Repeat, FileText, Download, Eye, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';

const ClientsPage: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, loading, error, clearError } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'project' | 'retainer'>('all');
  const [showRetainerSetup, setShowRetainerSetup] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandGuidelinesFile, setBrandGuidelinesFile] = useState<File | null>(null);
  const [brandToneOfVoiceFile, setBrandToneOfVoiceFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Debug: Log client types
  console.log('All clients:', clients.map(c => ({ id: c.id, name: c.name, type: c.type, retainerActive: c.retainerActive })));

  const handleDeleteClient = async (client: Client) => {
    try {
      await deleteClient(client.id);
      setDeletingClient(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  // Helper function to download files
  const downloadFile = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ClientCard: React.FC<{ client: Client }> = ({ client }) => {
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
    const [isExpanded, setIsExpanded] = useState(false);

    const togglePasswordVisibility = (index: number) => {
      setVisiblePasswords(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{client.companyName || client.name}</h3>
              <div className="flex-shrink-0 ml-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  client.type === 'retainer' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {client.type}
                </span>
              </div>
            </div>
          </div>
          {client.type === 'retainer' && !client.retainerActive && (
            <button
              onClick={() => {
                setNewClientId(client.id);
                setShowRetainerSetup(true);
              }}
              className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors flex-shrink-0"
              disabled={loading}
              title="Setup Retainer Billing"
            >
              <DollarSign className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>{client.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Phone className="h-3 w-3" />
              <span>{client.phone}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>Created {new Date(client.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-start">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span>{isExpanded ? 'Show less' : 'Show more'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="mt-4 space-y-4 overflow-hidden">
            {((client.brandColors && client.brandColors.length > 0) || (client.brandFonts && client.brandFonts.length > 0) || (client.socialMedia && client.socialMedia.length > 0)) && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {client.brandColors?.slice(0, 3).map((color, index) => (
                    <span key={index} className="inline-block w-3 h-3 rounded-full border border-gray-300" 
                          style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
                          title={color}></span>
                  ))}
                  {client.brandFonts?.slice(0, 2).map((font, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded" title={font}>
                      {font.split(' ')[0]}
                    </span>
                  ))}
                  {client.socialMedia?.slice(0, 2).map((account, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {account.platform}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Accounts */}
            {client.socialMedia && client.socialMedia.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Social Media Accounts</h4>
                <div className="space-y-2">
                  {client.socialMedia.map((account, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded-md">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{account.platform}</span>
                          <span className="text-sm text-gray-600">@{account.username}</span>
                        </div>
                        {account.password && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Password:</span>
                            <span className="text-sm text-gray-500 font-mono">
                              {visiblePasswords[index] ? account.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(index)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {visiblePasswords[index] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Documents */}
            {(client.brandGuidelines || client.brandToneOfVoice) && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Brand Documents</h4>
                <div className="space-y-2">
                  {client.brandGuidelines && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Brand Guidelines</span>
                      </div>
                      <button
                        onClick={() => downloadFile(client.brandGuidelines!, 'brand-guidelines')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {client.brandToneOfVoice && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Tone of Voice</span>
                      </div>
                      <button
                        onClick={() => downloadFile(client.brandToneOfVoice!, 'tone-of-voice')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons at Bottom */}
        <div className="flex items-center justify-start space-x-2 pt-4 border-t border-gray-100 mt-4">
          <button
            onClick={() => setEditingClient(client)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setDeletingClient(client)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const ClientModal: React.FC<{ client?: Client; onClose: () => void }> = ({ client, onClose }) => {
    const [formData, setFormData] = useState({
      name: client?.name || '',
      companyName: client?.companyName || '',
      email: client?.email || '',
      phone: client?.phone || '',
      type: client?.type || 'project' as 'project' | 'retainer',
      brandColors: client?.brandColors || [],
      brandFonts: client?.brandFonts || [],
      socialMedia: client?.socialMedia || []
    });

    const [newBrandColor, setNewBrandColor] = useState('');
    const [newBrandFont, setNewBrandFont] = useState('');
    const [newSocialMedia, setNewSocialMedia] = useState({
      platform: '',
      username: '',
      password: ''
    });

    const addBrandColor = () => {
      if (newBrandColor.trim() && !formData.brandColors.includes(newBrandColor.trim())) {
        setFormData({
          ...formData,
          brandColors: [...formData.brandColors, newBrandColor.trim()]
        });
        setNewBrandColor('');
      }
    };

    const removeBrandColor = (colorToRemove: string) => {
      setFormData({
        ...formData,
        brandColors: formData.brandColors.filter(color => color !== colorToRemove)
      });
    };

    const addBrandFont = () => {
      if (newBrandFont.trim() && !formData.brandFonts.includes(newBrandFont.trim())) {
        setFormData({
          ...formData,
          brandFonts: [...formData.brandFonts, newBrandFont.trim()]
        });
        setNewBrandFont('');
      }
    };

    const removeBrandFont = (fontToRemove: string) => {
      setFormData({
        ...formData,
        brandFonts: formData.brandFonts.filter(font => font !== fontToRemove)
      });
    };

    const addSocialMedia = () => {
      if (newSocialMedia.platform.trim() && newSocialMedia.username.trim()) {
        setFormData({
          ...formData,
          socialMedia: [...formData.socialMedia, { ...newSocialMedia }]
        });
        setNewSocialMedia({ platform: '', username: '', password: '' });
      }
    };

    const removeSocialMedia = (indexToRemove: number) => {
      setFormData({
        ...formData,
        socialMedia: formData.socialMedia.filter((_, index) => index !== indexToRemove)
      });
    };

    const togglePasswordVisibility = (index: number) => {
      setVisiblePasswords(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        // Convert files to base64
        let brandGuidelinesBase64 = client?.brandGuidelines; // Preserve existing file
        let brandToneOfVoiceBase64 = client?.brandToneOfVoice; // Preserve existing file

        if (brandGuidelinesFile) {
          brandGuidelinesBase64 = await convertFileToBase64(brandGuidelinesFile);
        }

        if (brandToneOfVoiceFile) {
          brandToneOfVoiceBase64 = await convertFileToBase64(brandToneOfVoiceFile);
        }

        // Convert form data to match TypeScript interface
        const clientData = {
          name: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          type: formData.type,
          brandAssets: [],
          brandGuidelines: brandGuidelinesBase64,
          brandToneOfVoice: brandToneOfVoiceBase64,
          brandColors: formData.brandColors,
          brandFonts: formData.brandFonts,
          socialMedia: formData.socialMedia,
          contractTemplate: undefined,
          chatChannelId: ''
        };

        if (client) {
          await updateClient(client.id, clientData);
          onClose();
        } else {
          try {
            const newClient = await addClient(clientData);
            // If this is a new retainer client, offer to setup retainer billing
            if (formData.type === 'retainer') {
              setNewClientId(newClient.id);
              setShowRetainerSetup(true);
            }
            onClose();
          } catch (error) {
            console.error('Failed to create client:', error);
            // Don't close modal on error
          }
        }
      } catch (error) {
        console.error('Failed to save client:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Helper function to convert file to base64
    const convertFileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = error => reject(error);
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {client ? 'Edit Client' : 'Add New Client'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'project' | 'retainer' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  >
                    <option value="project">Project</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>
              </div>

              {/* Brand Guidelines Upload */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Brand Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Guidelines Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setBrandGuidelinesFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX files only</p>
                    {(brandGuidelinesFile || client?.brandGuidelines) && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            {brandGuidelinesFile ? brandGuidelinesFile.name : 'Brand Guidelines Document'}
                          </span>
                        </div>
                        {client?.brandGuidelines && !brandGuidelinesFile && (
                          <button
                            type="button"
                            onClick={() => downloadFile(client.brandGuidelines!, 'brand-guidelines')}
                            className="mt-1 text-xs text-green-600 hover:text-green-700"
                          >
                            Download existing file
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Tone of Voice Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setBrandToneOfVoiceFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX files only</p>
                    {(brandToneOfVoiceFile || client?.brandToneOfVoice) && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            {brandToneOfVoiceFile ? brandToneOfVoiceFile.name : 'Tone of Voice Document'}
                          </span>
                        </div>
                        {client?.brandToneOfVoice && !brandToneOfVoiceFile && (
                          <button
                            type="button"
                            onClick={() => downloadFile(client.brandToneOfVoice!, 'tone-of-voice')}
                            className="mt-1 text-xs text-green-600 hover:text-green-700"
                          >
                            Download existing file
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Brand Colors</h4>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newBrandColor}
                    onChange={(e) => setNewBrandColor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBrandColor())}
                    placeholder="Add a brand color (e.g., #FF0000 or 'Red')"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={addBrandColor}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Add
                  </button>
                </div>
                {formData.brandColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.brandColors.map((color, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-sm">{color}</span>
                        <button
                          type="button"
                          onClick={() => removeBrandColor(color)}
                          className="text-gray-500 hover:text-red-600"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Fonts */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Brand Fonts</h4>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newBrandFont}
                    onChange={(e) => setNewBrandFont(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBrandFont())}
                    placeholder="Add a brand font (e.g., 'Helvetica Neue')"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={addBrandFont}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Add
                  </button>
                </div>
                {formData.brandFonts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.brandFonts.map((font, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-sm">{font}</span>
                        <button
                          type="button"
                          onClick={() => removeBrandFont(font)}
                          className="text-gray-500 hover:text-red-600"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Social Media Accounts</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <input
                    type="text"
                    value={newSocialMedia.platform}
                    onChange={(e) => setNewSocialMedia({ ...newSocialMedia, platform: e.target.value })}
                    placeholder="Platform (e.g., Instagram)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <input
                    type="text"
                    value={newSocialMedia.username}
                    onChange={(e) => setNewSocialMedia({ ...newSocialMedia, username: e.target.value })}
                    placeholder="Username"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newSocialMedia.password}
                        onChange={(e) => setNewSocialMedia({ ...newSocialMedia, password: e.target.value })}
                        placeholder="Password (optional)"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={addSocialMedia}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      disabled={isSubmitting}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {formData.socialMedia.length > 0 && (
                  <div className="space-y-2">
                    {formData.socialMedia.map((account, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{account.platform}</span>
                          <span className="text-gray-600">@{account.username}</span>
                          {account.password && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">
                                {visiblePasswords[index] ? account.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(index)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {visiblePasswords[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSocialMedia(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      {client ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    `${client ? 'Update' : 'Create'} Client`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await handleDeleteClient(client);
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
              <h3 className="text-lg font-medium text-gray-900">Delete Client</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be undone.
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
                  'Delete Client'
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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client relationships and projects</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'project' | 'retainer')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="all">All Types</option>
              <option value="project">Project</option>
              <option value="retainer">Retainer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
              <p className="text-sm text-gray-600">Total Clients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Repeat className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {clients.filter(c => c.type === 'retainer').length}
              </p>
              <p className="text-sm text-gray-600">Retainer Clients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {clients.filter(c => c.type === 'project').length}
              </p>
              <p className="text-sm text-gray-600">Project Clients</p>
            </div>
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
            <span className="text-gray-600">Loading clients...</span>
          </div>
        </div>
      )}

      {/* Clients Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {!loading && filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first client.'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <ClientModal onClose={() => setShowAddModal(false)} />
      )}
      
      {editingClient && (
        <ClientModal 
          client={editingClient} 
          onClose={() => setEditingClient(null)} 
        />
      )}

      {deletingClient && (
        <DeleteConfirmationModal
          client={deletingClient}
          onClose={() => setDeletingClient(null)}
        />
      )}

      {showRetainerSetup && newClientId && (
        <RetainerBillingSetup
          clientId={newClientId}
          onSetupComplete={() => {
            setShowRetainerSetup(false);
            setNewClientId(null);
          }}
          onCancel={() => {
            setShowRetainerSetup(false);
            setNewClientId(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientsPage;