import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Building, Mail, Phone, MapPin } from "lucide-react";

interface Client {
  company: string;
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  address?: string;
}

interface ClientInfoModalProps {
  client: Client;
}

export function ClientInfoModal({ client }: ClientInfoModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 text-left">
          <span className="text-sm font-medium">{client.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{client.company}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{client.name}</span>
          </div>
          
          {client.contact_person && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Contact: {client.contact_person}</span>
            </div>
          )}
          
          {client.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          )}
          
          {client.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">{client.address}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 