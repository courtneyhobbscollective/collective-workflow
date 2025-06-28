import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Edit, 
  Mail, 
  Building, 
  Phone, 
  Mail as MailIcon,
  User,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Palette,
  Type,
  Link,
  ExternalLink,
  FileText,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { useState } from "react";

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
}

interface ClientCardProps {
  client: Client;
  hasUser: boolean;
  onEdit: (client: Client) => void;
  onCreateUser: (client: Client) => void;
  onResendPassword: (client: Client) => void;
}

export function ClientCard({ 
  client, 
  hasUser, 
  onEdit, 
  onCreateUser, 
  onResendPassword 
}: ClientCardProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (platform: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={client.id} className="border rounded-lg bg-white shadow-sm">
        <AccordionTrigger hideChevron className="flex items-center w-full px-4 py-4 hover:bg-muted/50 transition-colors group no-underline hover:no-underline focus:no-underline">
          <div className="flex flex-col items-start flex-1">
            <h3 className="font-semibold text-base mb-1">{client.name}</h3>
            <div className="flex flex-col space-y-1 text-sm text-muted-foreground mb-1">
              <div className="flex items-center space-x-1">
                <Building className="w-3 h-3" />
                <span>{client.company}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MailIcon className="w-3 h-3" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="w-3 h-3" />
                <span>{client.phone}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {client.is_retainer ? (
                <Badge className="bg-green-100 text-green-800 border border-green-300 font-normal">
                  Retainer Client
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300 font-normal">
                  Project Client
                </Badge>
              )}
              {hasUser ? (
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-normal">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  User Created
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 border border-orange-300 font-normal">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No User
                </Badge>
              )}
            </div>
          </div>
          
          {/* Edit button and chevron on the right */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(client);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-accent transition-colors">
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </span>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="px-4 pb-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column: Client Information & User Management */}
            <div className="space-y-6">
              {/* Client Information */}
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <h4 className="font-medium text-base mb-4 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Client Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Name:</span>
                          <div className="text-muted-foreground">{client.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Company:</span>
                          <div className="text-muted-foreground">{client.company}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MailIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Email:</span>
                          <div className="text-muted-foreground">{client.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Phone:</span>
                          <div className="text-muted-foreground">{client.phone}</div>
                        </div>
                      </div>
                      {client.contact_person && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">Contact Person:</span>
                            <div className="text-muted-foreground">{client.contact_person}</div>
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Client Type:</span>
                        <div className="text-muted-foreground">{client.is_retainer ? 'Retainer' : 'Project'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {client.address && (
                    <div className="mt-6 pt-4 border-t">
                      <h5 className="font-medium text-sm mb-2">Address</h5>
                      <p className="text-sm text-muted-foreground">{client.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Management */}
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <h4 className="font-medium text-base mb-4">User Management</h4>
                  
                  {hasUser ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Client User Created</span>
                        </div>
                        <p className="text-sm text-green-600 mt-2">A user account is linked to this client.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => onResendPassword(client)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Password
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">No User Account</span>
                        </div>
                        <p className="text-sm text-orange-600 mt-2">This client doesn't have a user account yet.</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => onCreateUser(client)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Client User
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Brand Assets */}
            <div className="space-y-6">
              <Card className="bg-gray-50 h-full">
                <CardContent className="p-6">
                  <h4 className="font-medium text-base mb-4 flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Brand Assets
                  </h4>
                  
                  <div className="space-y-6">
                    {/* Documents Section */}
                    {(client.brand_guidelines_url || client.tone_of_voice_url) && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground">Documents</h5>
                        
                        {/* Brand Guidelines */}
                        {client.brand_guidelines_url && (
                          <div className="p-3 bg-white border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">Brand Guidelines</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(client.brand_guidelines_url, '_blank')}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Tone of Voice */}
                        {client.tone_of_voice_url && (
                          <div className="p-3 bg-white border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium">Tone of Voice</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(client.tone_of_voice_url, '_blank')}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Fonts Section */}
                    {client.fonts && Array.isArray(client.fonts) && client.fonts.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground flex items-center">
                          <Type className="w-4 h-4 mr-1" />
                          Fonts
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {client.fonts.map((font: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-sm">
                              {font}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Color Palette Section */}
                    {client.color_palette && Array.isArray(client.color_palette) && client.color_palette.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground flex items-center">
                          <Palette className="w-4 h-4 mr-1" />
                          Color Palette
                        </h5>
                        <div className="flex flex-wrap gap-3">
                          {client.color_palette.map((color: string, index: number) => (
                            <div
                              key={index}
                              className="flex flex-col items-center space-y-1"
                            >
                              <div
                                className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                              <span className="text-xs text-muted-foreground font-mono">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Logins Section */}
                    {client.social_logins && Object.keys(client.social_logins).length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm text-muted-foreground flex items-center">
                          <Link className="w-4 h-4 mr-1" />
                          Social Accounts
                        </h5>
                        <div className="space-y-3">
                          {Object.entries(client.social_logins).map(([platform, credentials]) => (
                            <div key={platform} className="p-3 bg-white border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium capitalize">{platform}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => togglePasswordVisibility(platform)}
                                >
                                  {visiblePasswords[platform] ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Username:</span> {credentials.username}</div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">Password:</span>
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                    {visiblePasswords[platform] ? credentials.password : '••••••••'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No brand assets message */}
                    {!client.brand_guidelines_url && 
                     !client.tone_of_voice_url && 
                     (!client.fonts || client.fonts.length === 0) && 
                     (!client.color_palette || client.color_palette.length === 0) && 
                     (!client.social_logins || Object.keys(client.social_logins).length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No brand assets added yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 