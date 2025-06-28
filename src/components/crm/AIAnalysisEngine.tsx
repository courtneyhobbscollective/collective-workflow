import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string;
  current_stage: string;
  status: string;
  due_date: string;
  estimated_hours: number;
  project_value: number;
  updated_at: string;
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
  assigned_staff: {
    id: string;
    name: string;
  } | null;
}

interface StageHistory {
  id: string;
  project_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_at: string;
  notes: string | null;
}

interface AIAnalysis {
  client_id: string;
  client_name: string;
  client_company: string;
  analysis_type: 'milestone_reached' | 'delay_alert' | 'completion_soon' | 'follow_up_needed' | 'new_project';
  priority: 'high' | 'medium' | 'low';
  suggested_message: string;
  suggested_subject: string;
  follow_up_days: number;
  project_data: any;
  confidence_score: number;
}

export function AIAnalysisEngine() {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    generateAIAnalysis();
  }, []);

  const generateAIAnalysis = async () => {
    setLoading(true);
    try {
      // Fetch recent project data
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, company, email),
          assigned_staff:staff(id, name)
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch stage history for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: stageHistory, error: historyError } = await supabase
        .from('project_stage_history')
        .select('*')
        .gte('changed_at', thirtyDaysAgo.toISOString())
        .order('changed_at', { ascending: false });

      if (historyError) throw historyError;

      // Generate AI analysis
      const aiAnalyses = await analyzeProjectData(projects || [], stageHistory || []);
      setAnalyses(aiAnalyses);

    } catch (error) {
      console.error('Error generating AI analysis:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeProjectData = async (projects: Project[], stageHistory: StageHistory[]): Promise<AIAnalysis[]> => {
    const analyses: AIAnalysis[] = [];
    const clientProjectMap = new Map<string, Project[]>();
    
    // Group projects by client
    projects.forEach(project => {
      if (!clientProjectMap.has(project.client_id)) {
        clientProjectMap.set(project.client_id, []);
      }
      clientProjectMap.get(project.client_id)!.push(project);
    });

    // Analyze each client's projects
    for (const [clientId, clientProjects] of clientProjectMap) {
      const client = clientProjects[0].client;
      
      // Check for milestone completions
      const recentStageChanges = stageHistory.filter(
        history => clientProjects.some(p => p.id === history.project_id)
      );

      // Analyze project progress
      clientProjects.forEach(project => {
        const daysUntilDue = project.due_date ? 
          Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        const lastUpdated = new Date(project.updated_at);
        const daysSinceUpdate = Math.ceil((new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

        // Milestone reached analysis
        if (recentStageChanges.some(h => h.project_id === project.id)) {
          const latestChange = recentStageChanges
            .filter(h => h.project_id === project.id)
            .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];

          analyses.push({
            client_id: clientId,
            client_name: client.name,
            client_company: client.company,
            analysis_type: 'milestone_reached',
            priority: 'medium',
            suggested_subject: `Project Update: ${project.title} - Milestone Completed`,
            suggested_message: generateMilestoneMessage(project, latestChange),
            follow_up_days: 3,
            project_data: project,
            confidence_score: 0.9
          });
        }

        // Delay alert analysis
        if (daysUntilDue !== null && daysUntilDue < 0 && project.status === 'active') {
          analyses.push({
            client_id: clientId,
            client_name: client.name,
            client_company: client.company,
            analysis_type: 'delay_alert',
            priority: 'high',
            suggested_subject: `Project Update: ${project.title} - Timeline Adjustment`,
            suggested_message: generateDelayMessage(project, Math.abs(daysUntilDue)),
            follow_up_days: 1,
            project_data: project,
            confidence_score: 0.95
          });
        }

        // Completion soon analysis
        if (daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0) {
          analyses.push({
            client_id: clientId,
            client_name: client.name,
            client_company: client.company,
            analysis_type: 'completion_soon',
            priority: 'medium',
            suggested_subject: `Project Update: ${project.title} - Final Stages`,
            suggested_message: generateCompletionMessage(project, daysUntilDue),
            follow_up_days: 2,
            project_data: project,
            confidence_score: 0.85
          });
        }

        // Follow-up needed analysis
        if (daysSinceUpdate > 14 && project.status === 'active') {
          analyses.push({
            client_id: clientId,
            client_name: client.name,
            client_company: client.company,
            analysis_type: 'follow_up_needed',
            priority: 'medium',
            suggested_subject: `Project Update: ${project.title} - Status Check`,
            suggested_message: generateFollowUpMessage(project, daysSinceUpdate),
            follow_up_days: 0,
            project_data: project,
            confidence_score: 0.8
          });
        }
      });
    }

    return analyses.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const generateMilestoneMessage = (project: Project, stageChange: StageHistory): string => {
    return `Hi ${project.client.name},

Great news! We've successfully completed a major milestone on your project "${project.title}".

${stageChange.notes ? `Notes: ${stageChange.notes}` : ''}

We're making excellent progress and are on track to deliver your project on time. The team is working hard to ensure everything meets your expectations.

If you have any questions or would like to discuss any aspects of the project, please don't hesitate to reach out.

Best regards,
The Collective Team`;
  };

  const generateDelayMessage = (project: Project, daysOverdue: number): string => {
    return `Hi ${project.client.name},

I wanted to update you on the progress of your project "${project.title}".

We've encountered some challenges that have caused a slight delay in our timeline. The project is currently ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} behind schedule.

We're actively working to get back on track and will provide you with a revised timeline shortly. The quality of your project remains our top priority.

I'll keep you updated on our progress and will reach out again once we have a clearer picture of the revised timeline.

Thank you for your understanding.

Best regards,
The Collective Team`;
  };

  const generateCompletionMessage = (project: Project, daysUntilDue: number): string => {
    return `Hi ${project.client.name},

Exciting news! Your project "${project.title}" is entering its final stages and is due for completion in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}.

We're putting the finishing touches on everything and conducting our final quality checks to ensure everything meets our high standards.

You can expect to receive the completed deliverables by the due date. We'll also provide you with a comprehensive handover document and any additional support you might need.

If you have any last-minute requests or questions, please let us know as soon as possible.

We're looking forward to delivering your project!

Best regards,
The Collective Team`;
  };

  const generateFollowUpMessage = (project: Project, daysSinceUpdate: number): string => {
    return `Hi ${project.client.name},

I hope this message finds you well. I wanted to touch base regarding your project "${project.title}".

It's been ${daysSinceUpdate} days since our last update, and I wanted to ensure you're still satisfied with the direction and progress of the project.

Is there anything specific you'd like to discuss or any concerns you might have? We're here to help and want to make sure everything is meeting your expectations.

I'm available for a call or meeting if you'd prefer to discuss anything in more detail.

Best regards,
The Collective Team`;
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone_reached': return <CheckCircle className="w-4 h-4" />;
      case 'delay_alert': return <AlertCircle className="w-4 h-4" />;
      case 'completion_soon': return <TrendingUp className="w-4 h-4" />;
      case 'follow_up_needed': return <Clock className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Analysis Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Analyzing project data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Analysis Engine
            </div>
            <Button onClick={generateAIAnalysis} variant="outline" size="sm">
              Refresh Analysis
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            AI-powered insights and suggested client communications based on project data
          </div>
          
          {analyses.length > 0 ? (
            <div className="space-y-4">
              {analyses.map((analysis, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getAnalysisTypeIcon(analysis.analysis_type)}
                      <Badge className={getPriorityColor(analysis.priority)}>
                        {analysis.priority} priority
                      </Badge>
                      <Badge variant="outline">
                        {analysis.analysis_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(analysis.confidence_score * 100)}% confidence
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="font-medium">{analysis.client_company}</div>
                    <div className="text-sm text-muted-foreground">
                      Contact: {analysis.client_name}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Suggested Subject:</div>
                    <div className="text-sm bg-gray-100 p-2 rounded">{analysis.suggested_subject}</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Suggested Message:</div>
                    <div className="text-sm bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                      {analysis.suggested_message}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Follow up in {analysis.follow_up_days} day{analysis.follow_up_days !== 1 ? 's' : ''}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      Use This Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No AI insights available at the moment</p>
              <p className="text-xs">Try refreshing the analysis or check back later</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 