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
  AlertCircle
} from "lucide-react";

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Client Information */}
            <div className="space-y-4 h-full">
              <Card className="bg-gray-50 h-full">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">Client Information</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span className="font-medium">Name:</span> {client.name}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="w-3 h-3" />
                      <span className="font-medium">Company:</span> {client.company}
                    </div>
                    <div className="flex items-center space-x-1">
                      <MailIcon className="w-3 h-3" />
                      <span className="font-medium">Email:</span> {client.email}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span className="font-medium">Phone:</span> {client.phone}
                    </div>
                    {client.contact_person && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">Contact Person:</span> {client.contact_person}
                      </div>
                    )}
                    <div><span className="font-medium">Client Type:</span> {client.is_retainer ? 'Retainer' : 'Project'}</div>
                  </div>
                  
                  {client.address && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Address</h4>
                      <p className="text-xs text-muted-foreground">{client.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right: User Management */}
            <div className="space-y-4 h-full">
              <Card className="bg-gray-50 h-full">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">User Management</h4>
                  
                  {hasUser ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Client User Created</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">A user account is linked to this client.</p>
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
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">No User Account</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">This client doesn't have a user account yet.</p>
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
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 