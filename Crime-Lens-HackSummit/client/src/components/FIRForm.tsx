import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface FIRFormData {
  // Personal Details
  complainantName: string;
  fatherHusbandName: string;
  age: number;
  gender: string;
  occupation: string;
  address: string;
  phone: string;
  email: string;
  
  // Incident Details
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  policeStation: string;
  crimeType: string;
  
  // Crime Details
  description: string;
  suspectName: string;
  suspectDescription: string;
  witnessDetails: string;
  propertyConcerned: string;
  estimatedLoss: number;
  
  // Additional Information
  previousComplaint: boolean;
  previousComplaintDetails: string;
  additionalInfo: string;
}

const FIRForm: React.FC = () => {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<FIRFormData>({
    complainantName: '',
    fatherHusbandName: '',
    age: 0,
    gender: '',
    occupation: '',
    address: '',
    phone: '',
    email: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    policeStation: '',
    crimeType: '',
    description: '',
    suspectName: '',
    suspectDescription: '',
    witnessDetails: '',
    propertyConcerned: '',
    estimatedLoss: 0,
    previousComplaint: false,
    previousComplaintDetails: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [lastSubmittedFIR, setLastSubmittedFIR] = useState<{ firId: string; firNumber: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/submit-fir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitMessage(`FIR submitted successfully! FIR Number: ${result.firNumber}`);
        setLastSubmittedFIR({ firId: result.firId, firNumber: result.firNumber });

        // Generate and download PDF
        try {
          const pdfResponse = await fetch(`/api/generate-pdf/${result.firId}`);
          if (pdfResponse.ok) {
            const blob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FIR_${result.firNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
        }

        // Reset form
        setFormData({
          complainantName: '',
          fatherHusbandName: '',
          age: 0,
          gender: '',
          occupation: '',
          address: '',
          phone: '',
          email: '',
          incidentDate: '',
          incidentTime: '',
          incidentLocation: '',
          policeStation: '',
          crimeType: '',
          description: '',
          suspectName: '',
          suspectDescription: '',
          witnessDetails: '',
          propertyConcerned: '',
          estimatedLoss: 0,
          previousComplaint: false,
          previousComplaintDetails: '',
          additionalInfo: ''
        });
      } else {
        setSubmitMessage('Error submitting FIR. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitMessage('Error submitting FIR. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!lastSubmittedFIR) return;
    try {
      const pdfResponse = await fetch(`/api/generate-pdf/${lastSubmittedFIR.firId}`);
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FIR_${lastSubmittedFIR.firNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('PDF download error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  First Information Report (FIR)
                </h1>
                <p className="text-sm text-muted-foreground">
                  Chennai Metropolitan Police - Digital FIR Submission
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <p className="text-muted-foreground">
              Please fill out all required fields accurately. Fields marked with * are mandatory.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Details Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b">
                Personal Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="complainantName">Complainant Name *</Label>
                  <Input
                    id="complainantName"
                    name="complainantName"
                    value={formData.complainantName}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fatherHusbandName">Father's/Husband's Name *</Label>
                  <Input
                    id="fatherHusbandName"
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="120"
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Incident Details Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b">
                Incident Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="incidentDate">Date of Incident *</Label>
                  <Input
                    type="date"
                    id="incidentDate"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="incidentTime">Time of Incident</Label>
                  <Input
                    type="time"
                    id="incidentTime"
                    name="incidentTime"
                    value={formData.incidentTime}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="policeStation">Police Station *</Label>
                  <Select value={formData.policeStation} onValueChange={(value) => handleSelectChange('policeStation', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Police Station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Central Police Station">Central Police Station</SelectItem>
                      <SelectItem value="North Police Station">North Police Station</SelectItem>
                      <SelectItem value="South Police Station">South Police Station</SelectItem>
                      <SelectItem value="East Police Station">East Police Station</SelectItem>
                      <SelectItem value="West Police Station">West Police Station</SelectItem>
                      <SelectItem value="Anna Nagar Police Station">Anna Nagar Police Station</SelectItem>
                      <SelectItem value="T.Nagar Police Station">T.Nagar Police Station</SelectItem>
                      <SelectItem value="Velachery Police Station">Velachery Police Station</SelectItem>
                      <SelectItem value="Adyar Police Station">Adyar Police Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="crimeType">Type of Crime *</Label>
                  <Select value={formData.crimeType} onValueChange={(value) => handleSelectChange('crimeType', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Crime Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Theft">Theft</SelectItem>
                      <SelectItem value="Robbery">Robbery</SelectItem>
                      <SelectItem value="Assault">Assault</SelectItem>
                      <SelectItem value="Fraud">Fraud</SelectItem>
                      <SelectItem value="Vandalism">Vandalism</SelectItem>
                      <SelectItem value="Domestic Violence">Domestic Violence</SelectItem>
                      <SelectItem value="Cyber Crime">Cyber Crime</SelectItem>
                      <SelectItem value="Drug Related">Drug Related</SelectItem>
                      <SelectItem value="Traffic Violation">Traffic Violation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="incidentLocation">Place of Incident *</Label>
                  <Textarea
                    id="incidentLocation"
                    name="incidentLocation"
                    value={formData.incidentLocation}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </Card>

            {/* Crime Details Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b">
                Crime Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="description">Detailed Description of the Incident *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    rows={5}
                    placeholder="Please provide a detailed description of what happened..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="suspectName">Suspect Name (if known)</Label>
                    <Input
                      id="suspectName"
                      name="suspectName"
                      value={formData.suspectName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedLoss">Estimated Loss (₹)</Label>
                    <Input
                      type="number"
                      id="estimatedLoss"
                      name="estimatedLoss"
                      value={formData.estimatedLoss}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="suspectDescription">Suspect Description</Label>
                  <Textarea
                    id="suspectDescription"
                    name="suspectDescription"
                    value={formData.suspectDescription}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Physical description, clothing, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="witnessDetails">Witness Details</Label>
                  <Textarea
                    id="witnessDetails"
                    name="witnessDetails"
                    value={formData.witnessDetails}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Names and contact details of witnesses"
                  />
                </div>

                <div>
                  <Label htmlFor="propertyConcerned">Property Concerned</Label>
                  <Textarea
                    id="propertyConcerned"
                    name="propertyConcerned"
                    value={formData.propertyConcerned}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={2}
                    placeholder="Details of stolen/damaged property"
                  />
                </div>
              </div>
            </Card>

            {/* Additional Information Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b">
                Additional Information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousComplaint"
                    checked={formData.previousComplaint}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, previousComplaint: checked as boolean }))
                    }
                  />
                  <Label htmlFor="previousComplaint" className="text-sm font-normal">
                    Have you filed a complaint about this incident before?
                  </Label>
                </div>

                {formData.previousComplaint && (
                  <div>
                    <Label htmlFor="previousComplaintDetails">Previous Complaint Details</Label>
                    <Textarea
                      id="previousComplaintDetails"
                      name="previousComplaintDetails"
                      value={formData.previousComplaintDetails}
                      onChange={handleInputChange}
                      className="mt-1"
                      rows={3}
                      placeholder="FIR number, date, police station, etc."
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="additionalInfo">Any Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Any other relevant information"
                  />
                </div>
              </div>
            </Card>

            {/* Submit Section */}
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-12 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit FIR'}
                </Button>
                
                {lastSubmittedFIR && (
                  <Button 
                    type="button" 
                    onClick={downloadPDF} 
                    variant="outline"
                    className="ml-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Again
                  </Button>
                )}

                {submitMessage && (
                  <div className={`p-4 rounded-lg border ${
                    submitMessage.includes('Error') 
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400' 
                      : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {submitMessage.includes('Error') ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      <span>{submitMessage}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FIRForm;
