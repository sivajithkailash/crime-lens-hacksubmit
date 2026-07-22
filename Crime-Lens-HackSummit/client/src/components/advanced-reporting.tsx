import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Send, 
  Clock, 
  Calendar,
  Mail,
  FileSpreadsheet,
  Presentation,
  Image,
  Archive,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Filter,
  Eye,
  BarChart3,
  PieChart,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { ChennaiEvents } from "@/components/chennai-events";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'analytical' | 'operational';
  format: 'pdf' | 'excel' | 'powerpoint' | 'csv' | 'json';
  sections: string[];
  lastUsed: Date;
  isCustom: boolean;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  nextRun: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  lastRun?: Date;
  parameters: Record<string, any>;
}

interface ExportJob {
  id: string;
  templateId: string;
  templateName: string;
  format: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  fileSize?: string;
  downloadUrl?: string;
}

interface AdvancedReportingProps {
  className?: string;
}

export function AdvancedReporting({ className = "" }: AdvancedReportingProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data generators
  const generateTemplates = (): ReportTemplate[] => [
    {
      id: 'template-1',
      name: 'Daily Crime Summary',
      description: 'Comprehensive overview of daily crime incidents and patterns',
      type: 'summary',
      format: 'pdf',
      sections: ['Executive Summary', 'Incident Statistics', 'Hotspots Analysis', 'Resource Status'],
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24),
      isCustom: false
    },
    {
      id: 'template-2',
      name: 'Weekly Trend Analysis',
      description: 'Detailed analysis of crime trends and predictive insights',
      type: 'analytical',
      format: 'excel',
      sections: ['Trend Charts', 'Comparative Analysis', 'Predictions', 'Recommendations'],
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      isCustom: false
    },
    {
      id: 'template-3',
      name: 'Monthly Executive Report',
      description: 'High-level presentation for leadership and stakeholders',
      type: 'summary',
      format: 'powerpoint',
      sections: ['Key Metrics', 'Success Stories', 'Challenges', 'Strategic Recommendations'],
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      isCustom: false
    },
    {
      id: 'template-4',
      name: 'Resource Allocation Report',
      description: 'Operational report on resource utilization and optimization',
      type: 'operational',
      format: 'pdf',
      sections: ['Resource Usage', 'Patrol Efficiency', 'Response Times', 'Budget Analysis'],
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      isCustom: false
    },
    {
      id: 'template-5',
      name: 'Community Safety Scorecard',
      description: 'District-wise safety metrics and community engagement data',
      type: 'detailed',
      format: 'excel',
      sections: ['Safety Scores', 'Community Feedback', 'Infrastructure Status', 'Improvement Plans'],
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      isCustom: true
    }
  ];

  const generateScheduledReports = (): ScheduledReport[] => [
    {
      id: 'schedule-1',
      templateId: 'template-1',
      name: 'Daily Morning Briefing',
      frequency: 'daily',
      recipients: ['commissioner@chennaipol.gov.in', 'operations@chennaipol.gov.in'],
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 8),
      status: 'active',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 16),
      parameters: { includeAlerts: true, timeRange: 'last24hours' }
    },
    {
      id: 'schedule-2',
      templateId: 'template-2',
      name: 'Weekly Analysis Report',
      frequency: 'weekly',
      recipients: ['analytics@chennaipol.gov.in', 'strategy@chennaipol.gov.in'],
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
      status: 'active',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      parameters: { includePredictions: true, detailLevel: 'high' }
    },
    {
      id: 'schedule-3',
      templateId: 'template-3',
      name: 'Monthly Executive Summary',
      frequency: 'monthly',
      recipients: ['chief@chennaipol.gov.in', 'mayor@chennai.gov.in'],
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      status: 'active',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      parameters: { executiveSummary: true, budgetAnalysis: true }
    }
  ];

  const generateExportJobs = (): ExportJob[] => [
    {
      id: 'job-1',
      templateId: 'template-1',
      templateName: 'Daily Crime Summary',
      format: 'PDF',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      completedAt: new Date(Date.now() - 1000 * 60 * 28),
      fileSize: '2.4 MB',
      downloadUrl: '#'
    },
    {
      id: 'job-2',
      templateId: 'template-2',
      templateName: 'Weekly Trend Analysis',
      format: 'Excel',
      status: 'processing',
      progress: 65,
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      fileSize: undefined
    },
    {
      id: 'job-3',
      templateId: 'template-4',
      templateName: 'Resource Allocation Report',
      format: 'PDF',
      status: 'queued',
      progress: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 2)
    }
  ];

  // Initialize data
  useEffect(() => {
    setTemplates(generateTemplates());
    setScheduledReports(generateScheduledReports());
    setExportJobs(generateExportJobs());
  }, []);

  // Simulate job progress
  useEffect(() => {
    const interval = setInterval(() => {
      setExportJobs(jobs => jobs.map(job => {
        if (job.status === 'processing' && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 15, 100);
          return {
            ...job,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'processing',
            completedAt: newProgress >= 100 ? new Date() : undefined,
            fileSize: newProgress >= 100 ? `${(Math.random() * 5 + 1).toFixed(1)} MB` : undefined
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    const template = templates.find(t => t.id === selectedTemplate);
    
    const newJob: ExportJob = {
      id: `job-${Date.now()}`,
      templateId: selectedTemplate,
      templateName: template?.name || 'Unknown Template',
      format: exportFormat.toUpperCase(),
      status: 'processing',
      progress: 5,
      createdAt: new Date()
    };

    setExportJobs(prev => [newJob, ...prev]);
    
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'active':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <FileText className="w-4 h-4" />;
      case 'analytical':
        return <BarChart3 className="w-4 h-4" />;
      case 'operational':
        return <Settings className="w-4 h-4" />;
      case 'detailed':
        return <Eye className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'powerpoint':
        return <Presentation className="w-4 h-4 text-orange-500" />;
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Advanced Reporting & Export
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate and schedule comprehensive crime analytics reports
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-select" className="text-sm font-medium">
                  Report Template
                </Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a report template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <span>{template.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format-select" className="text-sm font-medium">
                  Export Format
                </Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        PDF Document
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-500" />
                        Excel Spreadsheet
                      </div>
                    </SelectItem>
                    <SelectItem value="powerpoint">
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-orange-500" />
                        PowerPoint Presentation
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                        CSV Data
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Report Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-charts" defaultChecked />
                    <Label htmlFor="include-charts" className="text-sm">Include charts and visualizations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-raw-data" />
                    <Label htmlFor="include-raw-data" className="text-sm">Include raw data tables</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-recommendations" defaultChecked />
                    <Label htmlFor="include-recommendations" className="text-sm">Include AI recommendations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="executive-summary" defaultChecked />
                    <Label htmlFor="executive-summary" className="text-sm">Include executive summary</Label>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {selectedTemplate && (
                <Card className="p-4">
                  <h4 className="font-medium text-foreground mb-3">Template Preview</h4>
                  {(() => {
                    const template = templates.find(t => t.id === selectedTemplate);
                    if (!template) return null;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="secondary">{template.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">SECTIONS INCLUDED:</Label>
                          <div className="mt-1 space-y-1">
                            {template.sections.map((section, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{section}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Last used: {template.lastUsed.toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              )}

              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Current Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Regular Reports
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Archive className="w-4 h-4 mr-2" />
                    View Report Archive
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {scheduledReports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{report.name}</h4>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">
                          {report.frequency}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Template: {templates.find(t => t.id === report.templateId)?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Next Run:</span>
                      <div className="font-medium">{report.nextRun.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <div className="font-medium">
                        {report.lastRun ? report.lastRun.toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs text-muted-foreground">Recipients:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.recipients.map((email, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Run Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      disabled={report.status === 'paused'}
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {exportJobs.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{job.templateName}</h4>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getFormatIcon(job.format)}
                          <span className="text-xs text-muted-foreground">{job.format}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {job.createdAt.toLocaleString()}
                        {job.completedAt && (
                          <span> • Completed: {job.completedAt.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{Math.round(job.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {job.fileSize && <span>File Size: {job.fileSize}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button size="sm" variant="outline" className="text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Report Templates</h4>
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <div>
                        <h5 className="font-medium text-foreground">{template.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {template.type}
                          </Badge>
                          {getFormatIcon(template.format)}
                          <span className="text-xs text-muted-foreground">
                            {template.format.toUpperCase()}
                          </span>
                          {template.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>

                  <div className="text-xs text-muted-foreground mb-3">
                    Sections: {template.sections.length} • Last used: {template.lastUsed.toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    {template.isCustom && (
                      <Button size="sm" variant="ghost" className="text-xs text-red-500">
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="mb-4">
            <h4 className="font-medium text-foreground mb-2">Major Events Intelligence</h4>
            <p className="text-sm text-muted-foreground">
              Monitor upcoming major events in Chennai that may impact police resource allocation and crowd management requirements.
            </p>
          </div>
          
          <ChennaiEvents className="w-full" />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
