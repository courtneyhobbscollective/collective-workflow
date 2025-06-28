import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Send,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailSettings {
  autoSendEmails: boolean;
  emailTemplate: string;
  includeProjectUpdates: boolean;
  includeFollowUpReminders: boolean;
  signature: string;
}

interface EmailLog {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  subject: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
}

export function EmailIntegration() {
  const [settings, setSettings] = useState<EmailSettings>({
    autoSendEmails: true,
    emailTemplate: `Hi {client_name},

{message}

Best regards,
The Collective Team

{signature}`,
    includeProjectUpdates: true,
    includeFollowUpReminders: true,
    signature: `---
Collective Digital
Email: hello@collectivedigital.uk
Phone: +44 (0) 123 456 7890
Website: www.collectivedigital.uk`
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      // Simulate sending a test email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testLog: EmailLog = {
        id: Date.now().toString(),
        client_id: 'test',
        client_name: 'Test Client',
        client_email: 'test@example.com',
        subject: 'Test Email from CRM',
        message: 'This is a test email to verify the email integration is working.',
        sent_at: new Date().toISOString(),
        status: 'sent'
      };

      setEmailLogs(prev => [testLog, ...prev]);
      
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (key: keyof EmailSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge className="bg-green-100 text-green-800 border-green-300">Sent</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-send toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-send emails</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send emails to clients when messages are sent through the CRM
              </p>
            </div>
            <Switch
              checked={settings.autoSendEmails}
              onCheckedChange={(checked) => updateSettings('autoSendEmails', checked)}
            />
          </div>

          {/* Include project updates */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Include project updates</Label>
              <p className="text-sm text-muted-foreground">
                Automatically include project status updates in client emails
              </p>
            </div>
            <Switch
              checked={settings.includeProjectUpdates}
              onCheckedChange={(checked) => updateSettings('includeProjectUpdates', checked)}
            />
          </div>

          {/* Include follow-up reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Include follow-up reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send automated follow-up reminders to clients
              </p>
            </div>
            <Switch
              checked={settings.includeFollowUpReminders}
              onCheckedChange={(checked) => updateSettings('includeFollowUpReminders', checked)}
            />
          </div>

          {/* Email signature */}
          <div className="space-y-2">
            <Label className="text-base">Email Signature</Label>
            <textarea
              className="w-full p-3 border rounded-md min-h-[100px]"
              value={settings.signature}
              onChange={(e) => updateSettings('signature', e.target.value)}
              placeholder="Enter your email signature..."
            />
          </div>

          {/* Test email button */}
          <div className="flex justify-end">
            <Button 
              onClick={sendTestEmail} 
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Email Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailLogs.length > 0 ? (
            <div className="space-y-4">
              {emailLogs.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.sent_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="font-medium text-sm">{log.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      To: {log.client_name} ({log.client_email})
                    </div>
                  </div>
                  
                  <div className="text-sm bg-gray-100 p-2 rounded">
                    {log.message}
                  </div>
                  
                  {log.error_message && (
                    <div className="text-xs text-red-600 mt-2">
                      Error: {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No email logs yet</p>
              <p className="text-xs">Email activity will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 