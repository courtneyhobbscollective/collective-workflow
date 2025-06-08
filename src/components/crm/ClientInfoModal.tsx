
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User } from "lucide-react";

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
        <button className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{client.contact_person || client.name}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Company</label>
            <p className="text-lg font-semibold">{client.company}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Contact Name</label>
            <p>{client.name}</p>
          </div>
          {client.email && (
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p>{client.email}</p>
            </div>
          )}
          {client.phone && (
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p>{client.phone}</p>
            </div>
          )}
          {client.contact_person && (
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Person</label>
              <p>{client.contact_person}</p>
            </div>
          )}
          {client.address && (
            <div>
              <label className="text-sm font-medium text-gray-600">Address</label>
              <p>{client.address}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
