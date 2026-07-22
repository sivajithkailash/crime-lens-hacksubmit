import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Phone,
  MapPin
} from "lucide-react";
import { useLocation } from "wouter";

interface FIRRedirectPanelProps {
  className?: string;
}

export function FIRRedirectPanel({ className = "" }: FIRRedirectPanelProps) {
  const [, setLocation] = useLocation();

  const handleRedirectToFIR = () => {
    setLocation("/fir");
  };

  const emergencyServices = [
    { name: "Police Emergency", number: "100", icon: Shield },
    { name: "Fire Service", number: "101", icon: AlertTriangle },
    { name: "Medical Emergency", number: "108", icon: CheckCircle },
  ];

  const firBenefits = [
    "Digital FIR submission - No need to visit police station",
    "Instant FIR number generation",
    "PDF download for your records",
    "24/7 online availability",
    "Secure and confidential processing"
  ];

  return (
    <Card className={`p-6 ${className}`} data-testid="panel-fir-redirect">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            File FIR Online
          </h3>
          <p className="text-sm text-muted-foreground">
            Submit your First Information Report digitally
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg border bg-accent/10 border-accent/20">
          <div className="flex items-start gap-3 mb-3">
            <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground text-sm mb-1">
                Quick & Convenient
              </h4>
              <p className="text-xs text-muted-foreground">
                File your FIR online 24/7 from the comfort of your home. No need to wait in queues.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-primary/10 border-primary/20">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground text-sm mb-1">
                Secure Process
              </h4>
              <p className="text-xs text-muted-foreground">
                Your information is encrypted and processed through secure government channels.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground text-sm mb-1">
                Instant Confirmation
              </h4>
              <p className="text-xs text-muted-foreground">
                Get immediate FIR number and downloadable PDF for your records.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Key Benefits
        </h4>
        <ul className="space-y-2">
          {firBenefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-4 mb-6">
        <h4 className="font-medium text-foreground text-sm mb-3">
          Emergency Contacts
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {emergencyServices.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.number} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{service.name}</span>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {service.number}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <Button 
        onClick={handleRedirectToFIR}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
        data-testid="button-file-fir"
      >
        <FileText className="w-4 h-4 mr-2" />
        File FIR Online
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          For urgent matters, please call <strong>100</strong> immediately
        </p>
      </div>
    </Card>
  );
}
