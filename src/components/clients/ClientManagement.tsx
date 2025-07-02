import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus, Edit, Mail, X, Palette, Upload, FileText, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateClientUserModal } from "./CreateClientUserModal";
import { ResendPasswordModal } from "./ResendPasswordModal";
import { ClientCard } from "./ClientCard";

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  contact_person: string;
  phone: string;
  address: string;
  is_retainer: boolean;
  is_active: boolean;
  brand_guidelines_url?: string | null;
  tone_of_voice_url?: string | null;
  fonts?: any | null;
  color_palette?: any | null;
  social_logins?: Record<string, { username: string; password: string }> | null;
}

interface ClientProfile {
  user_id: string;
  client_id: string;
  // Removed 'user' object as it's not needed for this check and causes RLS issues
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    contact_person: "",
    address: "",
    is_retainer: false,
    brand_guidelines_url: "",
    tone_of_voice_url: "",
    fonts: [] as string[],
    color_palette: [] as string[],
    social_logins: {} as Record<string, { username: string; password: string }>,
  });
  const [newFont, setNewFont] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUsername, setNewSocialUsername] = useState("");
  const [newSocialPassword, setNewSocialPassword] = useState("");
  const [uploadingBrandGuidelines, setUploadingBrandGuidelines] = useState(false);
  const [uploadingToneOfVoice, setUploadingToneOfVoice] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedClientForUserCreation, setSelectedClientForUserCreation] = useState<Client | null>(null);
  const [showResendPasswordModal, setShowResendPasswordModal] = useState(false);
  const [selectedClientForPasswordReset, setSelectedClientForPasswordReset] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
    loadClientProfiles();
    checkStorageBucket();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('company');

      if (error) throw error;
      
      // Cast the data to Client type with proper type handling
      const typedClients: Client[] = (data || []).map(client => ({
        ...client,
        social_logins: client.social_logins && typeof client.social_logins === 'object' && !Array.isArray(client.social_logins) 
          ? client.social_logins as Record<string, { username: string; password: string }>
          : null
      }));
      
      setClients(typedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('client_id, user_id'); 
      if (error) throw error;
      setClientProfiles(data || []);
    } catch (error) {
      console.error('Error loading client profiles:', error);
    }
  };

  const checkStorageBucket = async () => {
    try {
      console.log('Checking storage bucket...');
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking storage buckets:', error);
        return;
      }
      
      console.log('Available storage buckets:', data);
      const clientAssetsBucket = data?.find(bucket => bucket.name === 'client-assets');
      
      if (clientAssetsBucket) {
        console.log('client-assets bucket found:', clientAssetsBucket);
      } else {
        console.log('client-assets bucket not found. Available buckets:', data?.map(b => b.name));
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      contact_person: "",
      address: "",
      is_retainer: false,
      brand_guidelines_url: "",
      tone_of_voice_url: "",
      fonts: [],
      color_palette: [],
      social_logins: {},
    });
    setNewFont("");
    setNewColor("#000000");
    setNewSocialPlatform("");
    setNewSocialUsername("");
    setNewSocialPassword("");
    setEditingClient(null);
    setShowForm(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email || "",
      phone: client.phone || "",
      contact_person: client.contact_person || "",
      address: client.address || "",
      is_retainer: client.is_retainer,
      brand_guidelines_url: client.brand_guidelines_url || "",
      tone_of_voice_url: client.tone_of_voice_url || "",
      fonts: Array.isArray(client.fonts) ? client.fonts : [],
      color_palette: Array.isArray(client.color_palette) ? client.color_palette : [],
      social_logins: client.social_logins && typeof client.social_logins === 'object' && !Array.isArray(client.social_logins) ? client.social_logins : {},
    });
    setShowForm(true);
  };

  const addFont = () => {
    if (newFont.trim() && !formData.fonts.includes(newFont.trim())) {
      setFormData({
        ...formData,
        fonts: [...formData.fonts, newFont.trim()]
      });
      setNewFont("");
    }
  };

  const removeFont = (fontToRemove: string) => {
    setFormData({
      ...formData,
      fonts: formData.fonts.filter(font => font !== fontToRemove)
    });
  };

  const addColor = () => {
    if (newColor && !formData.color_palette.includes(newColor)) {
      setFormData({
        ...formData,
        color_palette: [...formData.color_palette, newColor]
      });
      setNewColor("#000000");
    }
  };

  const removeColor = (colorToRemove: string) => {
    setFormData({
      ...formData,
      color_palette: formData.color_palette.filter(color => color !== colorToRemove)
    });
  };

  const addSocialLogin = () => {
    if (newSocialPlatform.trim() && newSocialUsername.trim() && newSocialPassword.trim()) {
      setFormData({
        ...formData,
        social_logins: {
          ...formData.social_logins,
          [newSocialPlatform.trim().toLowerCase()]: {
            username: newSocialUsername.trim(),
            password: newSocialPassword.trim()
          }
        }
      });
      setNewSocialPlatform("");
      setNewSocialUsername("");
      setNewSocialPassword("");
    }
  };

  const removeSocialLogin = (platform: string) => {
    const newSocialLogins = { ...formData.social_logins };
    delete newSocialLogins[platform];
    setFormData({
      ...formData,
      social_logins: newSocialLogins
    });
  };

  const uploadFile = async (file: File, type: 'brand_guidelines' | 'tone_of_voice') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `client-assets/${fileName}`;

    try {
      console.log('Uploading file:', { fileName, filePath, fileSize: file.size, fileType: file.type });
      
      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If storage bucket doesn't exist, try fallback method
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          console.log('Storage bucket not found, using fallback method...');
          return await uploadFileFallback(file, type);
        }
        
        throw uploadError;
      }

      console.log('File uploaded successfully, getting public URL...');

      const { data: { publicUrl } } = supabase.storage
        .from('client-assets')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const uploadFileFallback = async (file: File, type: 'brand_guidelines' | 'tone_of_voice'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Store as data URL for now
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBrandGuidelinesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Starting brand guidelines upload:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingBrandGuidelines(true);
    try {
      console.log('Uploading brand guidelines file...');
      const publicUrl = await uploadFile(file, 'brand_guidelines');
      console.log('Upload successful, public URL:', publicUrl);
      
      setFormData({ ...formData, brand_guidelines_url: publicUrl });
      toast({
        title: "Success",
        description: "Brand guidelines uploaded successfully",
      });
      
      // Clear the file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload failed:', error);
      let errorMessage = "Failed to upload brand guidelines";
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error.error) {
        errorMessage += `: ${error.error}`;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingBrandGuidelines(false);
    }
  };

  const handleToneOfVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Starting tone of voice upload:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingToneOfVoice(true);
    try {
      console.log('Uploading tone of voice file...');
      const publicUrl = await uploadFile(file, 'tone_of_voice');
      console.log('Upload successful, public URL:', publicUrl);
      
      setFormData({ ...formData, tone_of_voice_url: publicUrl });
      toast({
        title: "Success",
        description: "Tone of voice document uploaded successfully",
      });
      
      // Clear the file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload failed:', error);
      let errorMessage = "Failed to upload tone of voice document";
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error.error) {
        errorMessage += `: ${error.error}`;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingToneOfVoice(false);
    }
  };

  const removeBrandGuidelines = () => {
    setFormData({ ...formData, brand_guidelines_url: "" });
  };

  const removeToneOfVoice = () => {
    setFormData({ ...formData, tone_of_voice_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Convert arrays and objects to JSON for storage
    const submitData = {
      ...formData,
      fonts: formData.fonts.length > 0 ? formData.fonts : null,
      color_palette: formData.color_palette.length > 0 ? formData.color_palette : null,
      social_logins: Object.keys(formData.social_logins).length > 0 ? formData.social_logins : null,
    };

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(submitData)
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client onboarded successfully",
        });
      }

      resetForm();
      await loadClients();
      await loadClientProfiles();
      
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: editingClient ? "Failed to update client" : "Failed to onboard client",
        variant: "destructive",
      });
    }
  };

  const handleCreateUserClick = (client: Client) => {
    setSelectedClientForUserCreation(client);
    setShowCreateUserModal(true);
  };

  const handleUserCreated = () => {
    loadClientProfiles();
    setShowCreateUserModal(false);
    setSelectedClientForUserCreation(null);
  };

  const handleResendPasswordClick = (client: Client) => {
    setSelectedClientForPasswordReset(client);
    setShowResendPasswordModal(true);
  };

  const togglePasswordVisibility = (platform: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  // Add this function to handle client deletion
  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to delete client '${client.name}'? This action cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', client.id);
      if (error) throw error;
      toast({
        title: 'Client deleted',
        description: `Client '${client.name}' has been deleted.`,
      });
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Client Management</h2>
          <p className="text-muted-foreground">Onboard and manage your clients</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Onboard Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingClient ? 'Edit Client' : 'Onboard New Client'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Client Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Primary contact person"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Company address"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="retainer"
                    checked={formData.is_retainer}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_retainer: checked })}
                  />
                  <Label htmlFor="retainer">Is this a retainer client?</Label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Brand Assets</h3>
                
                {/* Brand Guidelines Upload */}
                <div>
                  <Label>Brand Guidelines Document</Label>
                  {formData.brand_guidelines_url ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Document uploaded</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(formData.brand_guidelines_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={removeBrandGuidelines}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(event) => {
                          console.log('Brand guidelines file input changed:', event.target.files);
                          handleBrandGuidelinesUpload(event);
                        }}
                        disabled={uploadingBrandGuidelines}
                        className="hidden"
                        id="brand-guidelines-upload"
                      />
                      <Label
                        htmlFor="brand-guidelines-upload"
                        className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {uploadingBrandGuidelines ? "Uploading..." : "Click to upload PDF or Word document"}
                          </span>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>

                {/* Tone of Voice Upload */}
                <div>
                  <Label>Tone of Voice Document</Label>
                  {formData.tone_of_voice_url ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Document uploaded</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(formData.tone_of_voice_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={removeToneOfVoice}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(event) => {
                          console.log('Tone of voice file input changed:', event.target.files);
                          handleToneOfVoiceUpload(event);
                        }}
                        disabled={uploadingToneOfVoice}
                        className="hidden"
                        id="tone-of-voice-upload"
                      />
                      <Label
                        htmlFor="tone-of-voice-upload"
                        className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {uploadingToneOfVoice ? "Uploading..." : "Click to upload PDF or Word document"}
                          </span>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* Fonts */}
                  <div>
                    <Label>Fonts</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newFont}
                        onChange={(e) => setNewFont(e.target.value)}
                        placeholder="Enter font name"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFont())}
                      />
                      <Button type="button" onClick={addFont} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.fonts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.fonts.map((font, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {font}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removeFont(font)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Color Palette */}
                  <div>
                    <Label>Color Palette</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="#000000"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                      />
                      <Button type="button" onClick={addColor} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.color_palette.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.color_palette.map((color, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <div
                              className="w-8 h-8 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-sm">{color}</span>
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removeColor(color)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Social Logins */}
                  <div>
                    <Label>Social Login Credentials</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Input
                        value={newSocialPlatform}
                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                        placeholder="Platform (e.g., instagram)"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={newSocialUsername}
                          onChange={(e) => setNewSocialUsername(e.target.value)}
                          placeholder="Username/Email"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSocialLogin())}
                        />
                        <Input
                          type="password"
                          value={newSocialPassword}
                          onChange={(e) => setNewSocialPassword(e.target.value)}
                          placeholder="Password"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSocialLogin())}
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={addSocialLogin} size="sm" className="mt-2">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Platform
                    </Button>
                    {Object.keys(formData.social_logins).length > 0 && (
                      <div className="space-y-2 mt-2">
                        {Object.entries(formData.social_logins).map(([platform, credentials]) => (
                          <div key={platform} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize text-sm">{platform}</span>
                              <X 
                                className="w-4 h-4 cursor-pointer text-gray-500 hover:text-gray-700" 
                                onClick={() => removeSocialLogin(platform)}
                              />
                            </div>
                            <div className="space-y-1 text-xs">
                              <div><span className="font-medium">Username:</span> {credentials.username}</div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Password:</span>
                                <span className="font-mono">
                                  {visiblePasswords[platform] ? credentials.password : '••••••••'}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() => togglePasswordVisibility(platform)}
                                >
                                  {visiblePasswords[platform] ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingClient ? 'Update Client' : 'Onboard Client'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clients.map((client) => {
          const clientUser = clientProfiles.find(profile => profile.client_id === client.id);
          const hasUser = !!clientUser;
          
          return (
            <ClientCard 
              key={client.id} 
              client={client} 
              hasUser={hasUser} 
              onEdit={handleEdit} 
              onCreateUser={handleCreateUserClick}
              onResendPassword={handleResendPasswordClick} 
              onDelete={handleDeleteClient}
            />
          );
        })}
      </div>

      {selectedClientForUserCreation && (
        <CreateClientUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          client={selectedClientForUserCreation}
          onUserCreated={handleUserCreated}
        />
      )}

      {selectedClientForPasswordReset && (
        <ResendPasswordModal
          isOpen={showResendPasswordModal}
          onClose={() => setShowResendPasswordModal(false)}
          clientEmail={selectedClientForPasswordReset.email}
        />
      )}
    </div>
  );
}