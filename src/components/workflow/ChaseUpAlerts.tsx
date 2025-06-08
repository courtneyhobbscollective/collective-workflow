
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, X, Mail } from "lucide-react";
import { useChaseUpAlerts } from "@/hooks/useChaseUpAlerts";

export function ChaseUpAlerts() {
  const { alerts, loading, dismissAlert, sendFollowUp, getDaysOverdue } = useChaseUpAlerts();

  if (loading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center">
        <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
        Client Chase-Up Alerts ({alerts.length})
      </h3>
      
      {alerts.map((alert) => {
        const daysOverdue = getDaysOverdue(alert.chase_up_due_at);
        
        return (
          <Alert key={alert.id} className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">
              Follow-up needed: {alert.project.title}
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-orange-700">
                    Client: {alert.project.client.name}
                  </span>
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                  </Badge>
                  {alert.chase_count > 0 && (
                    <Badge variant="secondary">
                      Chase #{alert.chase_count + 1}
                    </Badge>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissAlert(alert.id)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear Reminder
                  </Button>
                  
                  {alert.project.client.email && (
                    <Button
                      size="sm"
                      onClick={() => sendFollowUp(
                        alert.id, 
                        alert.project.title, 
                        alert.project.client.email!
                      )}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Send Follow-up
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
