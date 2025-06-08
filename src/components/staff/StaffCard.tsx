
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Mail, CheckCircle, Clock } from "lucide-react";
import type { Staff } from "@/types/staff";

interface StaffCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onResendInvitation: (staff: Staff) => void;
}

export function StaffCard({ staff, onEdit, onResendInvitation }: StaffCardProps) {
  const getStatusBadge = (invitationStatus?: string) => {
    switch (invitationStatus) {
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'invited':
        return <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" />Invited</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      default:
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={staff.profile_picture_url || undefined} />
              <AvatarFallback>
                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{staff.name}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(staff)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{staff.email}</p>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              staff.role === 'Admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {staff.role}
            </span>
            {getStatusBadge(staff.invitation_status)}
          </div>
          {staff.invitation_status === 'invited' && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => onResendInvitation(staff)}
            >
              <Mail className="w-4 h-4 mr-2" />
              Resend Invitation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
