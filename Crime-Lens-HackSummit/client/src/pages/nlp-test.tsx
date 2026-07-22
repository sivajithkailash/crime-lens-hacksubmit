import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function NLPTest() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/social-media/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, language }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error('Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
    }
    setIsAnalyzing(false);
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-500 text-white';
      case 'negative':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white animate-pulse';
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          NLP Analysis Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Text Analysis
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="te">Telugu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="text">Text to Analyze</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text for sentiment analysis..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={analyzeText} 
                disabled={!text.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
              </Button>

              <div className="space-y-2">
                <h3 className="font-medium">Sample Texts to Try:</h3>
                <div className="space-y-1 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 text-left justify-start"
                    onClick={() => setText("Chennai Police response was excellent! Very professional service.")}
                  >
                    English: "Chennai Police response was excellent! Very professional service."
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 text-left justify-start"
                    onClick={() => setText("சென்னை போலீஸ் மிக நல்லா வேலை செய்யுறாங்க. பாதுகாப்பு சிறப்பு!")}
                  >
                    Tamil: "சென்னை போலீஸ் மிக நல்லா வேலை செய்யுறாங்க. பாதுகாப்பு சிறப்பு!"
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 text-left justify-start"
                    onClick={() => setText("This is terrible! I hate this place. Very dangerous area.")}
                  >
                    Negative: "This is terrible! I hate this place. Very dangerous area."
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Analysis Results
            </h2>

            {result ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Original Text:</h3>
                  <p className="p-2 bg-muted rounded text-sm">{result.text}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{result.language}</Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Crime Related</Label>
                    <div className="mt-1">
                      <Badge variant={result.crimeRelated ? "destructive" : "secondary"}>
                        {result.crimeRelated ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Sentiment Analysis:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSentimentColor(result.sentiment.label)}>
                        {result.sentiment.label.toUpperCase()}
                      </Badge>
                      <span className="text-sm">
                        Score: {result.sentiment.score.toFixed(2)} | 
                        Confidence: {Math.round(result.sentiment.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Threat Level:</h3>
                  <Badge className={getThreatColor(result.threatLevel)}>
                    {result.threatLevel.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Hate Speech Detection:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.hateSpeech.detected ? "destructive" : "secondary"}>
                        {result.hateSpeech.detected ? "DETECTED" : "NOT DETECTED"}
                      </Badge>
                      <span className="text-sm">
                        Confidence: {Math.round(result.hateSpeech.confidence * 100)}%
                      </span>
                    </div>
                    {result.hateSpeech.categories.length > 0 && (
                      <div>
                        <Label className="text-xs">Categories:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.hateSpeech.categories.map((cat, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {result.keywords.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Keywords:</h3>
                    <div className="flex flex-wrap gap-1">
                      {result.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter text and click "Analyze Text" to see results
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
