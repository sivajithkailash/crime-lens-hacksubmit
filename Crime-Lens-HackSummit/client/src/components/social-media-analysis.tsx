import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Twitter, 
  MessageCircle, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  MapPin, 
  Clock,
  Eye,
  Filter,
  Search,
  Volume2,
  VolumeX,
  RefreshCw,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Zap,
  Shield,
  Flag
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram';
  content: string;
  author: string;
  authorHandle: string;
  timestamp: Date;
  location?: string;
  district: string;
  sentiment: {
    score: number; // -1 to 1
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  language: string;
  languageCode: string;
  categories: string[];
  metrics: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  crimeRelated: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  hateSpeech: {
    detected: boolean;
    confidence: number;
    categories: string[];
  };
  keywords: string[];
  verified: boolean;
}

interface TrendingTopic {
  keyword: string;
  volume: number;
  sentiment: number;
  growth: number;
  locations: string[];
  category: 'crime' | 'safety' | 'police' | 'community' | 'emergency';
}

interface DistrictSentiment {
  district: string;
  overallSentiment: number;
  postCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  threatLevel: 'low' | 'medium' | 'high';
  keyTopics: string[];
}

interface SocialMediaAnalysisProps {
  className?: string;
}

export function SocialMediaAnalysis({ className = "" }: SocialMediaAnalysisProps) {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [districtSentiments, setDistrictSentiments] = useState<DistrictSentiment[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [hateSpeechFilter, setHateSpeechFilter] = useState(false);
  const [crimeOnlyFilter, setCrimeOnlyFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreatLevel, setSelectedThreatLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data generators for social media analysis
  const generateSocialMediaPosts = (): SocialMediaPost[] => {
    const districts = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Adyar', 'Tambaram', 'Central Chennai', 'Mylapore', 'Perungudi'];
    const platforms: Array<'twitter' | 'facebook' | 'instagram'> = ['twitter', 'facebook', 'instagram'];
    const languages = [
      { name: 'English', code: 'en' },
      { name: 'Tamil', code: 'ta' },
      { name: 'Hindi', code: 'hi' },
      { name: 'Telugu', code: 'te' }
    ];
    
    const samplePosts = [
      "Police response was very quick in T.Nagar today. Impressed with Chennai Police! 👮‍♂️ #ChennaiPolice #Safety",
      "சென்னை போலீஸ் மிக நல்லா வேலை செய்யுறாங்க. வேலூர் பகுதியில் பாதுகாப்பு நல்லா இருக்கு #சென்னைபோலீஸ்",
      "Street lights not working in Anna Nagar for 3 days. Safety concern for women walking at night #ChennaiCorp",
      "Witnessed a theft near Marina Beach. Police arrived within 10 minutes! Great job @ChennaiPolice",
      "Traffic police doing excellent work managing rush hour traffic in Velachery #Traffic #Chennai",
      "आज रात अड्यार में बहुत शोर था। पुलिस को कॉल करना पड़ा। #चेन्नई #सुरक्षा",
      "Community policing initiative in Tambaram is working well. Neighbors are more connected now 🏘️",
      "Concerned about increasing vehicle thefts in IT corridor. Need more patrol cars #Safety #Velachery",
      "Kudos to Chennai Police for quick action on cyber crime complaint. Very professional service! 💻",
      "పెరుంగుడిలో రోడ్ సేఫ్టీ చాలా మెరుగుపడింది. పోలీసులకు ధన్యవాదాలు #రోడ్సేఫ్టీ"
    ];

    return Array.from({ length: 50 }, (_, index) => {
      const district = districts[Math.floor(Math.random() * districts.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const language = languages[Math.floor(Math.random() * languages.length)];
      const content = samplePosts[Math.floor(Math.random() * samplePosts.length)];
      const sentimentScore = (Math.random() - 0.5) * 2; // -1 to 1
      const isCrimeRelated = Math.random() > 0.6;
      const hasHateSpeech = Math.random() > 0.9;

      return {
        id: `post-${index}`,
        platform,
        content,
        author: `User${Math.floor(Math.random() * 1000)}`,
        authorHandle: `@user${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        location: district,
        district,
        sentiment: {
          score: sentimentScore,
          label: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral',
          confidence: Math.random() * 0.4 + 0.6
        },
        language: language.name,
        languageCode: language.code,
        categories: isCrimeRelated ? ['crime', 'safety'] : ['community', 'general'],
        metrics: {
          likes: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
          reach: Math.floor(Math.random() * 10000) + 1000
        },
        crimeRelated: isCrimeRelated,
        threatLevel: hasHateSpeech ? 'high' : isCrimeRelated && sentimentScore < -0.5 ? 'medium' : 'low',
        hateSpeech: {
          detected: hasHateSpeech,
          confidence: hasHateSpeech ? Math.random() * 0.3 + 0.7 : Math.random() * 0.2,
          categories: hasHateSpeech ? ['harassment', 'threats'] : []
        },
        keywords: ['police', 'safety', 'chennai', district.toLowerCase()],
        verified: Math.random() > 0.8
      };
    });
  };

  const generateTrendingTopics = (): TrendingTopic[] => [
    {
      keyword: '#ChennaiPolice',
      volume: 2847,
      sentiment: 0.65,
      growth: 23.5,
      locations: ['T.Nagar', 'Anna Nagar', 'Velachery'],
      category: 'police'
    },
    {
      keyword: 'Traffic Safety',
      volume: 1923,
      sentiment: -0.2,
      growth: 12.8,
      locations: ['Central Chennai', 'Adyar', 'Tambaram'],
      category: 'safety'
    },
    {
      keyword: 'Night Patrol',
      volume: 1456,
      sentiment: 0.8,
      growth: 45.2,
      locations: ['Anna Nagar', 'Mylapore'],
      category: 'police'
    },
    {
      keyword: 'Street Lighting',
      volume: 1234,
      sentiment: -0.4,
      growth: -5.3,
      locations: ['Perungudi', 'Tambaram'],
      category: 'safety'
    },
    {
      keyword: 'Community Watch',
      volume: 987,
      sentiment: 0.9,
      growth: 67.4,
      locations: ['Velachery', 'Adyar'],
      category: 'community'
    }
  ];

  const generateDistrictSentiments = (posts: SocialMediaPost[]): DistrictSentiment[] => {
    const districts = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Adyar', 'Tambaram', 'Central Chennai', 'Mylapore', 'Perungudi'];
    
    return districts.map(district => {
      const districtPosts = posts.filter(post => post.district === district);
      const positiveCount = districtPosts.filter(p => p.sentiment.label === 'positive').length;
      const neutralCount = districtPosts.filter(p => p.sentiment.label === 'neutral').length;
      const negativeCount = districtPosts.filter(p => p.sentiment.label === 'negative').length;
      const overallSentiment = districtPosts.reduce((acc, p) => acc + p.sentiment.score, 0) / districtPosts.length || 0;
      
      return {
        district,
        overallSentiment,
        postCount: districtPosts.length,
        positiveCount,
        neutralCount,
        negativeCount,
        threatLevel: overallSentiment < -0.3 ? 'high' : overallSentiment < 0 ? 'medium' : 'low',
        keyTopics: ['safety', 'police', 'community'].slice(0, Math.floor(Math.random() * 3) + 1)
      };
    });
  };

  // Fetch real data from API
  const fetchSocialMediaData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [postsResponse, trendingResponse, sentimentResponse] = await Promise.all([
        fetch('/api/social-media/posts?limit=50'),
        fetch('/api/social-media/trending'),
        fetch('/api/social-media/district-sentiment')
      ]);

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        // Convert timestamp strings to Date objects
        const processedPosts = postsData.map((post: any) => ({
          ...post,
          timestamp: new Date(post.timestamp)
        }));
        setPosts(processedPosts);
      }

      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingTopics(trendingData);
      }

      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json();
        setDistrictSentiments(sentimentData);
      }
    } catch (error) {
      console.error('Error fetching social media data:', error);
      setError('Failed to load social media data. Using demo data.');
      
      // Fallback to mock data if API fails
      const generatedPosts = generateSocialMediaPosts();
      setPosts(generatedPosts);
      setTrendingTopics(generateTrendingTopics());
      setDistrictSentiments(generateDistrictSentiments(generatedPosts));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchSocialMediaData();
  }, []);

  // Real-time updates using API
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(async () => {
      try {
        await fetchSocialMediaData();
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // Filter posts based on current selections
  const filteredPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      if (selectedDistrict !== 'all' && post.district !== selectedDistrict) return false;
      if (selectedPlatform !== 'all' && post.platform !== selectedPlatform) return false;
      if (selectedLanguage !== 'all' && post.languageCode !== selectedLanguage) return false;
      if (selectedThreatLevel !== 'all' && post.threatLevel !== selectedThreatLevel) return false;
      if (hateSpeechFilter && !post.hateSpeech.detected) return false;
      if (crimeOnlyFilter && !post.crimeRelated) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchContent = post.content.toLowerCase().includes(query);
        const matchAuthor = post.author.toLowerCase().includes(query);
        const matchKeywords = post.keywords.some(keyword => keyword.toLowerCase().includes(query));
        if (!matchContent && !matchAuthor && !matchKeywords) return false;
      }
      return true;
    });

    // Sort filtered posts
    return filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'sentiment':
          aValue = a.sentiment.score;
          bValue = b.sentiment.score;
          break;
        case 'engagement':
          aValue = a.metrics.likes + a.metrics.shares + a.metrics.comments;
          bValue = b.metrics.likes + b.metrics.shares + b.metrics.comments;
          break;
        case 'reach':
          aValue = a.metrics.reach;
          bValue = b.metrics.reach;
          break;
        default: // timestamp
          // Ensure timestamp is a Date object
          const aTimestamp = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
          const bTimestamp = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
          aValue = aTimestamp.getTime();
          bValue = bTimestamp.getTime();
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [posts, selectedDistrict, selectedPlatform, selectedLanguage, selectedThreatLevel, hateSpeechFilter, crimeOnlyFilter, searchQuery, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSocialMediaData();
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500 text-white';
      case 'negative':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getThreatLevelColor = (level: string) => {
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'facebook':
        return <Users className="w-4 h-4" />;
      case 'instagram':
        return <Eye className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  // Chart data preparation
  const sentimentChartData = useMemo(() => {
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    filteredPosts.forEach(post => {
      sentimentCounts[post.sentiment.label]++;
    });
    
    return [
      { name: 'Positive', value: sentimentCounts.positive, fill: '#10b981' },
      { name: 'Neutral', value: sentimentCounts.neutral, fill: '#6b7280' },
      { name: 'Negative', value: sentimentCounts.negative, fill: '#ef4444' }
    ];
  }, [filteredPosts]);

  const districtSentimentChart = useMemo(() => {
    return districtSentiments.map(district => ({
      name: district.district.split(' ')[0],
      sentiment: Math.round(district.overallSentiment * 100),
      posts: district.postCount,
      positive: district.positiveCount,
      negative: district.negativeCount
    }));
  }, [districtSentiments]);

  const languageDistribution = useMemo(() => {
    const langCounts: Record<string, number> = {};
    filteredPosts.forEach(post => {
      langCounts[post.language] = (langCounts[post.language] || 0) + 1;
    });
    
    return Object.entries(langCounts).map(([lang, count]) => ({
      name: lang,
      value: count,
      fill: lang === 'Tamil' ? '#ff6b35' : lang === 'English' ? '#4f46e5' : lang === 'Hindi' ? '#10b981' : '#8b5cf6'
    }));
  }, [filteredPosts]);

  // Professional Loading Component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <LoadingSkeleton />
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className} shadow-xl border-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900`}>
      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Twitter className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Media Intelligence
            </h3>
            <p className="text-sm text-muted-foreground">
              Real-time sentiment analysis • Multi-platform monitoring • AI threat detection
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border shadow-sm">
            <Switch 
              id="real-time" 
              checked={realTimeEnabled} 
              onCheckedChange={setRealTimeEnabled}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
            />
            <Label htmlFor="real-time" className="text-sm font-medium">Live Feed</Label>
          </div>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-muted-foreground">Updated:</span>
            <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">Posts:</span>
            <span className="font-bold text-green-600">{filteredPosts.length.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="text-muted-foreground">Languages:</span>
            <span className="font-medium text-purple-600">{new Set(posts.map(p => p.language)).size}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-600" />
            <span className="text-muted-foreground">Threats:</span>
            <span className="font-bold text-orange-600">
              {posts.filter(p => p.threatLevel === 'high' || p.threatLevel === 'critical').length}
            </span>
          </div>
          
          {realTimeEnabled && (
            <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-blue-500 text-white animate-pulse border-0">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
          
          <div className="ml-auto">
            <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
              AI Powered
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-foreground">Smart Filters & Search</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, authors, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 transition-colors"
            />
          </div>

          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="h-10 bg-white dark:bg-slate-700 border-2">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districtSentiments.map((district) => (
                <SelectItem key={district.district} value={district.district}>
                  {district.district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="h-10 bg-white dark:bg-slate-700 border-2">
              <Twitter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="h-10 bg-white dark:bg-slate-700 border-2">
              <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="te">Telugu</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedThreatLevel} onValueChange={setSelectedThreatLevel}>
            <SelectTrigger className="h-10 bg-white dark:bg-slate-700 border-2">
              <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Threat Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Threats</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-700 px-3 py-2 rounded-lg border">
            <Switch 
              id="hate-speech" 
              checked={hateSpeechFilter} 
              onCheckedChange={setHateSpeechFilter}
              className="data-[state=checked]:bg-red-500"
            />
            <Label htmlFor="hate-speech" className="text-sm font-medium">Hate Speech Only</Label>
          </div>

          <div className="flex items-center space-x-2 bg-white dark:bg-slate-700 px-3 py-2 rounded-lg border">
            <Switch 
              id="crime-only" 
              checked={crimeOnlyFilter} 
              onCheckedChange={setCrimeOnlyFilter}
              className="data-[state=checked]:bg-orange-500"
            />
            <Label htmlFor="crime-only" className="text-sm font-medium">Crime Related Only</Label>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Recent</SelectItem>
                <SelectItem value="sentiment">Sentiment</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="reach">Reach</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 px-2"
            >
              {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="posts" 
            className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Live Posts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sentiment" 
            className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Sentiment</span>
          </TabsTrigger>
          <TabsTrigger 
            value="trending" 
            className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Trending</span>
          </TabsTrigger>
          <TabsTrigger 
            value="threats" 
            className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Threats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-8">
          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  +{Math.round(Math.random() * 15 + 5)}%
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Posts Analyzed</p>
                <p className="text-3xl font-bold text-foreground">
                  {filteredPosts.length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last 24 hours
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Positive
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Positive Sentiment</p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round((filteredPosts.filter(p => p.sentiment.label === 'positive').length / filteredPosts.length) * 100) || 0}%
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Overall community mood
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse">
                  Alert
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-3xl font-bold text-foreground">
                  {filteredPosts.filter(p => p.hateSpeech.detected || p.threatLevel === 'high' || p.threatLevel === 'critical').length}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Requiring immediate attention
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Multi-lingual
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Languages</p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(filteredPosts.map(p => p.language)).size}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Multilingual community coverage
                </p>
              </div>
            </Card>
          </div>

          {/* Enhanced Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">Sentiment Analysis</h4>
                  <p className="text-xs text-muted-foreground">Community mood distribution</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    dataKey="value"
                    strokeWidth={3}
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">District Sentiment</h4>
                  <p className="text-xs text-muted-foreground">Sentiment scores by area</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={districtSentimentChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    domain={[-100, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="sentiment" 
                    fill="url(#colorGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">Language Distribution</h4>
                  <p className="text-xs text-muted-foreground">Multilingual engagement</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Pie
                    data={languageDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    dataKey="value"
                    strokeWidth={3}
                  >
                    {languageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground">Live Social Media Feed</h4>
                <p className="text-sm text-muted-foreground">Real-time posts from Chennai social networks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                Live Feed
              </Badge>
              <span className="text-sm text-muted-foreground">
                Showing {filteredPosts.length} posts
              </span>
            </div>
          </div>

          <ScrollArea className="h-[600px] rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-4 p-4">
              {filteredPosts.slice(0, 30).map((post, index) => (
                <Card 
                  key={post.id} 
                  className={`p-5 hover:shadow-lg transition-all duration-300 border-l-4 ${
                    post.hateSpeech.detected ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' :
                    post.threatLevel === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10' :
                    post.sentiment.label === 'positive' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10' :
                    post.sentiment.label === 'negative' ? 'border-l-red-400 bg-red-50 dark:bg-red-900/10' :
                    'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  } animate-in slide-in-from-top-2`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        post.platform === 'twitter' ? 'bg-blue-500' :
                        post.platform === 'facebook' ? 'bg-blue-600' :
                        'bg-purple-500'
                      }`}>
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{post.author}</span>
                          <span className="text-xs text-muted-foreground">{post.authorHandle}</span>
                          {post.verified && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {post.timestamp.toLocaleString()}
                          <MapPin className="w-3 h-3 ml-2" />
                          {post.district}
                          <Globe className="w-3 h-3 ml-2" />
                          {post.language}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${getSentimentColor(post.sentiment.label)} shadow-sm`}>
                        {post.sentiment.label === 'positive' ? '😊' : post.sentiment.label === 'negative' ? '😞' : '😐'}
                        {post.sentiment.label}
                      </Badge>
                      {post.hateSpeech.detected && (
                        <Badge className="bg-red-600 text-white animate-pulse shadow-sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Hate Speech
                        </Badge>
                      )}
                      {post.crimeRelated && (
                        <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-50">
                          <Shield className="w-3 h-3 mr-1" />
                          Crime Related
                        </Badge>
                      )}
                      <Badge className={`${getThreatLevelColor(post.threatLevel)} shadow-sm`}>
                        {post.threatLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-foreground leading-relaxed mb-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      {post.content}
                    </p>
                    
                    {post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.keywords.slice(0, 5).map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800">
                            #{keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-2 text-pink-600">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium">{post.metrics.likes.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-2 text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium">{post.metrics.comments.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-2 text-green-600">
                        <Eye className="w-4 h-4" />
                        <span className="font-medium">{post.metrics.reach.toLocaleString()}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="w-3 h-3" />
                        <span>AI Confidence: {Math.round(post.sentiment.confidence * 100)}%</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-blue-50">
                          <Flag className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-blue-50">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No posts found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters to see more posts</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-4">District Sentiment Analysis</h4>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {districtSentiments.map((district) => (
                    <Card key={district.district} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-foreground">{district.district}</h5>
                        <Badge className={getThreatLevelColor(district.threatLevel)}>
                          {district.threatLevel.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span>Overall Sentiment</span>
                          <span className="font-medium">
                            {district.overallSentiment > 0 ? '+' : ''}{Math.round(district.overallSentiment * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={((district.overallSentiment + 1) / 2) * 100} 
                          className="h-2" 
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="p-2 bg-green-50 rounded">
                          <div className="font-medium text-green-700">{district.positiveCount}</div>
                          <div className="text-green-600">Positive</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="font-medium text-gray-700">{district.neutralCount}</div>
                          <div className="text-gray-600">Neutral</div>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <div className="font-medium text-red-700">{district.negativeCount}</div>
                          <div className="text-red-600">Negative</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">Key Topics:</div>
                        <div className="flex flex-wrap gap-1">
                          {district.keyTopics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Sentiment Timeline</h4>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={districtSentimentChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[-100, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-4">Trending Topics</h4>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <Card key={topic.keyword} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{index + 1}</span>
                        <span className="font-medium text-foreground">{topic.keyword}</span>
                        <Badge variant="secondary">{topic.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {topic.growth > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          topic.growth > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {topic.growth > 0 ? '+' : ''}{topic.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="font-medium ml-1">{topic.volume.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sentiment:</span>
                        <span className={`font-medium ml-1 ${
                          topic.sentiment > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {topic.sentiment > 0 ? '+' : ''}{Math.round(topic.sentiment * 100)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Locations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {topic.locations.map((location) => (
                          <Badge key={location} variant="outline" className="text-xs">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Topic Volume Trends</h4>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendingTopics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="keyword" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="volume" stroke="#8884d8" name="Volume" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-700">High Threats</span>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {filteredPosts.filter(p => p.threatLevel === 'high' || p.threatLevel === 'critical').length}
                </div>
                <div className="text-xs text-red-600">Immediate attention required</div>
              </Card>

              <Card className="p-4 border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-700">Hate Speech</span>
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {filteredPosts.filter(p => p.hateSpeech.detected).length}
                </div>
                <div className="text-xs text-yellow-600">AI-detected violations</div>
              </Card>

              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-blue-700">Crime Related</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {filteredPosts.filter(p => p.crimeRelated).length}
                </div>
                <div className="text-xs text-blue-600">Safety-related discussions</div>
              </Card>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-3">
                {filteredPosts
                  .filter(post => post.hateSpeech.detected || post.threatLevel === 'high' || post.threatLevel === 'critical')
                  .slice(0, 10)
                  .map((post) => (
                  <Card key={post.id} className="p-4 border-red-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <span className="font-medium text-sm">{post.author}</span>
                        <Badge className={getThreatLevelColor(post.threatLevel)}>
                          {post.threatLevel.toUpperCase()}
                        </Badge>
                        {post.hateSpeech.detected && (
                          <Badge className="bg-red-600 text-white">
                            HATE SPEECH
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Flag className="w-3 h-3 mr-1" />
                          Flag
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Investigate
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-foreground mb-2 p-2 bg-gray-50 rounded">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{post.timestamp.toLocaleString()}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {post.district}
                        </span>
                        <span>Confidence: {Math.round(post.hateSpeech.confidence * 100)}%</span>
                      </div>
                    </div>

                    {post.hateSpeech.detected && post.hateSpeech.categories.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Hate Speech Categories:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.hateSpeech.categories.map((category) => (
                            <Badge key={category} variant="destructive" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
