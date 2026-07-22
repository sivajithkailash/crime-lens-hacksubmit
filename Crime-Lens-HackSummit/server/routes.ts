import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nlpService } from "./services/nlpService";
import { twitterService } from "./services/twitterService";
import { mongoDBService } from "./services/mongodb";
import authRoutes from "./routes/auth";
import eventsRoutes from "./routes/events";
import PDFDocument from 'pdfkit';

// Professional PDF generation function using pdfkit
function generateFIRPDF(fir: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(20)
         .fillColor('#000080')
         .text('FIRST INFORMATION REPORT (FIR)', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(14)
         .fillColor('#000080')
         .text('Chennai Metropolitan Police', { align: 'center' })
         .moveDown(0.5);
      
      // Add line separator
      doc.strokeColor('#000080')
         .lineWidth(2)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown(1);
      
      // FIR Details
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`FIR Number: ${fir.firNumber}`, { continued: true })
         .text(`        FIR ID: ${fir.firId}`, { align: 'right' })
         .moveDown(0.5)
         .text(`Date of Submission: ${new Date(fir.submittedAt).toLocaleDateString()}`, { continued: true })
         .text(`        Status: ${fir.status}`, { align: 'right' })
         .moveDown(1);
      
      // Personal Details Section
      addSectionHeader(doc, 'PERSONAL DETAILS');
      doc.fontSize(11)
         .text(`Complainant Name: ${fir.complainantName}`)
         .text(`Father's/Husband's Name: ${fir.fatherHusbandName}`)
         .text(`Age: ${fir.age}        Gender: ${fir.gender}        Occupation: ${fir.occupation || 'Not specified'}`)
         .text(`Phone: ${fir.phone}        Email: ${fir.email || 'Not provided'}`)
         .text(`Address: ${fir.address}`)
         .moveDown(1);
      
      // Incident Details Section
      addSectionHeader(doc, 'INCIDENT DETAILS');
      doc.fontSize(11)
         .text(`Date of Incident: ${fir.incidentDate}        Time: ${fir.incidentTime || 'Not specified'}`)
         .text(`Police Station: ${fir.policeStation}`)
         .text(`Type of Crime: ${fir.crimeType}`)
         .text(`Place of Incident:`)
         .fontSize(10)
         .text(`${fir.incidentLocation}`, { indent: 20 })
         .moveDown(1);
      
      // Crime Details Section
      addSectionHeader(doc, 'CRIME DETAILS');
      doc.fontSize(11)
         .text('Description of Incident:')
         .fontSize(10)
         .text(`${fir.description}`, { indent: 20, width: 500 })
         .moveDown(0.5);
      
      doc.fontSize(11)
         .text(`Suspect Name: ${fir.suspectName || 'Unknown'}`)
         .text(`Estimated Loss: ₹${fir.estimatedLoss || 0}`)
         .moveDown(0.5);
      
      if (fir.suspectDescription) {
        doc.text('Suspect Description:')
           .fontSize(10)
           .text(fir.suspectDescription, { indent: 20, width: 500 })
           .moveDown(0.5);
      }
      
      if (fir.witnessDetails) {
        doc.fontSize(11)
           .text('Witness Details:')
           .fontSize(10)
           .text(fir.witnessDetails, { indent: 20, width: 500 })
           .moveDown(0.5);
      }
      
      if (fir.propertyConcerned) {
        doc.fontSize(11)
           .text('Property Concerned:')
           .fontSize(10)
           .text(fir.propertyConcerned, { indent: 20, width: 500 })
           .moveDown(1);
      }
      
      // Additional Information Section
      addSectionHeader(doc, 'ADDITIONAL INFORMATION');
      doc.fontSize(11)
         .text(`Previous Complaint Filed: ${fir.previousComplaint ? 'Yes' : 'No'}`);
      
      if (fir.previousComplaint && fir.previousComplaintDetails) {
        doc.text('Previous Complaint Details:')
           .fontSize(10)
           .text(fir.previousComplaintDetails, { indent: 20, width: 500 })
           .moveDown(0.5);
      }
      
      if (fir.additionalInfo) {
        doc.fontSize(11)
           .text('Additional Information:')
           .fontSize(10)
           .text(fir.additionalInfo, { indent: 20, width: 500 })
           .moveDown(1);
      }
      
      // Footer
      doc.moveDown(2);
      addSectionHeader(doc, 'IMPORTANT NOTICE');
      doc.fontSize(10)
         .fillColor('#666666')
         .text('This FIR has been digitally submitted and recorded in the Chennai Metropolitan Police database.', { align: 'center' })
         .moveDown(0.5)
         .text('For any queries regarding this FIR, please contact:', { align: 'center' })
         .text(`FIR Number: ${fir.firNumber} | Police Station: ${fir.policeStation} | Emergency: 100`, { align: 'center' })
         .moveDown(1)
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);
      
      // Footer line
      doc.strokeColor('#000080')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.fontSize(12)
         .fillColor('#000080')
         .text('Chennai Metropolitan Police - Digital FIR System', { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to add section headers
function addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(12)
     .fillColor('#000080')
     .text(title, { underline: true })
     .fillColor('#000000')
     .moveDown(0.5);
}


// Ward to District mapping for Chennai
const WARD_TO_DISTRICT_MAPPING: Record<string, { district: string; region: string; population: number }> = {
  // Central Chennai Districts
  'Ward-1': { district: 'Central Chennai', region: 'Central', population: 45000 },
  'Ward-2': { district: 'Central Chennai', region: 'Central', population: 42000 },
  'Ward-3': { district: 'Central Chennai', region: 'Central', population: 38000 },
  'Ward-4': { district: 'Anna Nagar', region: 'Central', population: 35000 },
  'Ward-5': { district: 'Anna Nagar', region: 'Central', population: 40000 },
  'Ward-6': { district: 'Anna Nagar', region: 'Central', population: 37000 },
  'Ward-7': { district: 'T.Nagar', region: 'Central', population: 32000 },
  'Ward-8': { district: 'T.Nagar', region: 'Central', population: 28000 },
  'Ward-9': { district: 'T.Nagar', region: 'Central', population: 30000 },
  'Ward-10': { district: 'T.Nagar', region: 'Central', population: 33000 },
  
  // North Chennai Districts
  'Ward-11': { district: 'North Chennai', region: 'North', population: 48000 },
  'Ward-12': { district: 'North Chennai', region: 'North', population: 52000 },
  'Ward-13': { district: 'North Chennai', region: 'North', population: 46000 },
  'Ward-14': { district: 'North Chennai', region: 'North', population: 44000 },
  'Ward-15': { district: 'Avadi', region: 'North', population: 38000 },
  'Ward-16': { district: 'Avadi', region: 'North', population: 41000 },
  'Ward-17': { district: 'Avadi', region: 'North', population: 39000 },
  
  // South Chennai Districts
  'Ward-18': { district: 'South Chennai', region: 'South', population: 55000 },
  'Ward-19': { district: 'South Chennai', region: 'South', population: 58000 },
  'Ward-20': { district: 'South Chennai', region: 'South', population: 53000 },
  'Ward-21': { district: 'South Chennai', region: 'South', population: 49000 },
  'Ward-22': { district: 'Velachery', region: 'South', population: 43000 },
  'Ward-23': { district: 'Velachery', region: 'South', population: 47000 },
  'Ward-24': { district: 'Velachery', region: 'South', population: 45000 },
  'Ward-25': { district: 'Tambaram', region: 'South', population: 42000 },
  'Ward-26': { district: 'Tambaram', region: 'South', population: 46000 },
  'Ward-27': { district: 'Tambaram', region: 'South', population: 44000 },
  
  // Additional wards
  'Ward-28': { district: 'Central Chennai', region: 'Central', population: 36000 },
  'Ward-29': { district: 'Anna Nagar', region: 'Central', population: 34000 },
  'Ward-30': { district: 'North Chennai', region: 'North', population: 51000 },
  'Ward-31': { district: 'South Chennai', region: 'South', population: 56000 },
  'Ward-32': { district: 'Velachery', region: 'South', population: 48000 },
  'Ward-33': { district: 'Tambaram', region: 'South', population: 43000 },
  'Ward-34': { district: 'Avadi', region: 'North', population: 40000 },
  'Ward-35': { district: 'T.Nagar', region: 'Central', population: 31000 },
};

// Helper function to get district info from ward
function getDistrictFromWard(ward: string) {
  return WARD_TO_DISTRICT_MAPPING[ward] || { district: 'Unknown District', region: 'Chennai', population: 35000 };
}

// Helper function to generate mock social media posts
function generateMockSocialMediaPosts(limit: number) {
  const districts = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Adyar', 'Tambaram', 'Central Chennai', 'Mylapore', 'Perungudi'];
  const platforms = ['twitter', 'facebook', 'instagram'] as const;
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
    "పెరుంగుడిలో రోడ్ సేఫ్టీ చాలా మెరుగుపడింది. పోలీసులకు ధన్యవాదాలు #రోడ్సేఫ్టీ",
    "Emergency response in Chennai has improved significantly. Ambulance arrived in 5 minutes! #Emergency",
    "Police patrolling increased in our area after recent incidents. Feeling safer now #Security",
    "Night patrol officers are doing great job in Anna Nagar. Thank you for keeping us safe! #NightPatrol",
    "CCTV cameras installation completed in our street. Technology helping in crime prevention #CCTV #Safety",
    "Community watch program started in our locality. Neighbors working together with police #CommunityPolicing"
  ];

  return Array.from({ length: limit }, (_, index) => {
    const district = districts[Math.floor(Math.random() * districts.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const language = languages[Math.floor(Math.random() * languages.length)];
    const content = samplePosts[Math.floor(Math.random() * samplePosts.length)];
    const isCrimeRelated = Math.random() > 0.4;
    const isVerified = Math.random() > 0.8;

    return {
      id: `mock-${index}`,
      platform,
      content,
      author: `User${Math.floor(Math.random() * 1000)}`,
      authorHandle: `@user${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      location: district,
      district,
      language: language.code, // This should be a valid language code
      crimeRelated: isCrimeRelated,
      verified: isVerified,
      metrics: {
        likes: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50),
        reach: Math.floor(Math.random() * 10000) + 1000
      }
    };
  });
}

// Helper functions for data transformation
function getCrimeIcon(crimeType: string): string {
  const iconMap: Record<string, string> = {
    'theft': 'fas fa-user-secret',
    'burglary': 'fas fa-home',
    'robbery': 'fas fa-mask',
    'violence': 'fas fa-fist-raised',
    'drugs': 'fas fa-pills',
    'pickpocketing': 'fas fa-hand-holding',
    'domestic_dispute': 'fas fa-home',
    'traffic_violation': 'fas fa-car',
    'assault': 'fas fa-fist-raised',
    'fraud': 'fas fa-credit-card'
  };
  return iconMap[crimeType.toLowerCase()] || 'fas fa-exclamation-triangle';
}

function getCrimeColor(crimeType: string): string {
  const colorMap: Record<string, string> = {
    'theft': 'hsl(280, 100%, 70%)',
    'burglary': 'hsl(170, 70%, 50%)',
    'robbery': 'hsl(0, 72%, 51%)',
    'violence': 'hsl(45, 93%, 58%)',
    'drugs': 'hsl(260, 100%, 60%)',
    'pickpocketing': 'hsl(200, 100%, 50%)',
    'domestic_dispute': 'hsl(30, 100%, 50%)',
    'traffic_violation': 'hsl(120, 100%, 50%)',
    'assault': 'hsl(0, 100%, 50%)',
    'fraud': 'hsl(300, 100%, 50%)'
  };
  return colorMap[crimeType.toLowerCase()] || 'hsl(0, 0%, 50%)';
}

function generateMonthlyData(totalCount: number): Array<{ month: string; count: number }> {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const avgMonthly = totalCount / 12;
  
  return months.map(month => ({
    month,
    count: Math.floor(avgMonthly * (0.7 + Math.random() * 0.6))
  }));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use("/api/auth", authRoutes);
  
  // Events routes
  app.use("/api/events", eventsRoutes);

  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'CrimeLens API is running',
      timestamp: new Date().toISOString()
    });
  });

  // Crime dashboard API routes
  
  // Get dashboard overview data
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const data = await storage.getDashboardData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Get crime statistics
  app.get("/api/crime-stats", async (_req, res) => {
    try {
      const stats = await storage.getCrimeStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching crime stats:", error);
      res.status(500).json({ message: "Failed to fetch crime statistics" });
    }
  });

  // Get crime categories
  app.get("/api/crime-categories", async (_req, res) => {
    try {
      const categories = await storage.getCrimeCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching crime categories:", error);
      res.status(500).json({ message: "Failed to fetch crime categories" });
    }
  });

  // Get districts
  app.get("/api/districts", async (_req, res) => {
    try {
      const districts = await storage.getDistricts();
      res.json(districts);
    } catch (error) {
      console.error("Error fetching districts:", error);
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  });

  // Get unified districts from MongoDB with crime data
  app.get("/api/mongodb/districts", async (_req, res) => {
    try {
      const districtStats = await mongoDBService.getCrimeStatsByDistrict();
      
      // Transform MongoDB district data to frontend format
      const districts = districtStats.map(stat => ({
        id: stat.district.toLowerCase().replace(/\s+/g, '-'),
        name: stat.district,
        region: stat.region,
        population: stat.population,
        totalIncidents: stat.totalIncidents,
        avgLatitude: stat.avgLatitude,
        avgLongitude: stat.avgLongitude,
        highSeverityCount: stat.highSeverityCount,
        mediumSeverityCount: stat.mediumSeverityCount,
        lowSeverityCount: stat.lowSeverityCount
      }));
      
      res.json(districts);
    } catch (error) {
      console.error("Error fetching MongoDB districts:", error);
      res.status(500).json({ message: "Failed to fetch MongoDB districts" });
    }
  });

  // Get crime incidents with optional filtering
  app.get("/api/crime-incidents", async (req, res) => {
    try {
      const { categoryId, districtId } = req.query;
      const incidents = await storage.getCrimeIncidents(
        categoryId as string, 
        districtId as string
      );
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching crime incidents:", error);
      res.status(500).json({ message: "Failed to fetch crime incidents" });
    }
  });

  // Get active alerts
  app.get("/api/alerts", async (_req, res) => {
    try {
      const alerts = await storage.getCrimeAlerts(true);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Get AI insights
  app.get("/api/insights", async (_req, res) => {
    try {
      const insights = await storage.getAiInsights();
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Social Media Analysis API routes
  
  // Analyze sentiment of a single text
  app.post("/api/social-media/analyze-text", async (req, res) => {
    try {
      const { text, language } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const mockPost = {
        id: 'temp-' + Date.now(),
        platform: 'twitter' as const,
        content: text,
        author: 'User',
        authorHandle: '@user',
        timestamp: new Date(),
        district: 'Chennai',
        language
      };

      const result = await nlpService.analyzeSocialMediaPost(mockPost);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing text:", error);
      res.status(500).json({ message: "Failed to analyze text" });
    }
  });

  // Get real Twitter posts with analysis
  app.get("/api/social-media/posts", async (req, res) => {
    try {
      const { district, platform, language, limit = '5', query = 'Chennai Police OR Chennai Safety OR Chennai Crime' } = req.query;
      
      let posts = [];
      
      // If platform is not specified or is Twitter, get Twitter data
      if (!platform || platform === 'all' || platform === 'twitter') {
        try {
          // Limit Twitter API calls to avoid rate limiting
          const maxTwitterResults = Math.min(parseInt(limit as string), 5);
          console.log(`Fetching ${maxTwitterResults} Twitter posts to avoid rate limits`);
          
          const twitterPosts = await twitterService.searchTweets({
            query: query as string,
            location: district !== 'all' ? district as string : 'Chennai',
            maxResults: maxTwitterResults,
            language: language !== 'all' ? language as string : undefined
          });
          posts.push(...twitterPosts);
        } catch (error) {
          console.error('Twitter API rate limit hit, returning cached/mock data');
          // Fall back to mock data if Twitter fails
          const mockPosts = generateMockSocialMediaPosts(Math.min(parseInt(limit as string), 5));
          posts.push(...mockPosts);
        }
      }
      
      // If no real data and platform includes other platforms, add mock data
      if (posts.length === 0 || (platform && ['facebook', 'instagram'].includes(platform as string))) {
        const remainingLimit = Math.max(0, Math.min(parseInt(limit as string), 5) - posts.length);
        const mockPosts = generateMockSocialMediaPosts(remainingLimit)
          .filter(post => !platform || platform === 'all' || post.platform === platform);
        posts.push(...mockPosts);
      }
      
      // Filter posts based on query parameters
      let filteredPosts = posts;
      
      if (district && district !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.district === district);
      }
      
      if (language && language !== 'all') {
        filteredPosts = filteredPosts.filter(post => 
          post.language === language || 
          (post as any).languageCode === language
        );
      }

      // Analyze each post with NLP (limit to max 5 posts)
      const postsToAnalyze = filteredPosts.slice(0, Math.min(parseInt(limit as string), 5));
      console.log(`Analyzing ${postsToAnalyze.length} posts`);
      
      const analyzedPosts = await Promise.all(
        postsToAnalyze.map(async (post) => {
          const mockPost = {
            id: post.id,
            platform: post.platform,
            content: post.content,
            author: post.author,
            authorHandle: post.authorHandle,
            timestamp: post.timestamp,
            district: post.district,
            language: post.language
          };
          
          let analysis;
          try {
            analysis = await nlpService.analyzeSocialMediaPost(mockPost);
          } catch (nlpError) {
            console.error('NLP analysis failed for post:', post.id, nlpError);
            // Provide fallback analysis if NLP fails
            analysis = {
              sentiment: { score: 0, comparative: 0, label: 'neutral' as const, confidence: 0.5 },
              language: 'en',
              hateSpeech: { detected: false, confidence: 0, categories: [] },
              keywords: [],
              crimeRelated: false,
              threatLevel: 'low' as const
            };
          }
          
          return {
            id: post.id,
            platform: post.platform,
            content: post.content,
            author: post.author,
            authorHandle: post.authorHandle,
            timestamp: post.timestamp,
            location: post.location,
            district: post.district,
            sentiment: analysis.sentiment,
            language: analysis.language,
            languageCode: post.language || analysis.language,
            categories: analysis.crimeRelated ? ['crime', 'safety'] : ['community', 'general'],
            metrics: post.metrics,
            crimeRelated: analysis.crimeRelated,
            threatLevel: analysis.threatLevel,
            hateSpeech: analysis.hateSpeech,
            keywords: analysis.keywords,
            verified: post.verified
          };
        })
      );

      // Add API status info
      const responseData = {
        posts: analyzedPosts,
        meta: {
          total: analyzedPosts.length,
          twitterApiAvailable: twitterService.isAvailable(),
          source: twitterService.isAvailable() ? 'real' : 'mock',
          query: query,
          filters: { district, platform, language }
        }
      };

      res.json(analyzedPosts); // Keep backward compatibility
    } catch (error) {
      console.error("Error fetching social media posts:", error);
      res.status(500).json({ message: "Failed to fetch social media posts" });
    }
  });

  // Get trending topics from Twitter API
  app.get("/api/social-media/trending", async (req, res) => {
    try {
      const { location = 'Chennai' } = req.query;
      
      // Try to get real trending topics from Twitter
      const trendingTopics = await twitterService.getTrendingTopics(location as string);
      
      res.json(trendingTopics);
    } catch (error) {
      console.error("Error fetching trending topics:", error);
      res.status(500).json({ message: "Failed to fetch trending topics" });
    }
  });

  // Get API integration status
  app.get("/api/social-media/status", async (_req, res) => {
    try {
      const twitterAvailable = twitterService.isAvailable();
      const twitterConnected = twitterAvailable ? await twitterService.testConnection() : false;
      
      const status = {
        twitter: {
          available: twitterAvailable,
          connected: twitterConnected,
          hasCredentials: !!(process.env.TWITTER_BEARER_TOKEN || process.env.TWITTER_API_KEY),
          credentialTypes: {
            bearerToken: !!process.env.TWITTER_BEARER_TOKEN,
            fullOAuth: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET && 
                         process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_SECRET)
          }
        },
        nlp: {
          available: true,
          languages: ['English', 'Tamil', 'Hindi', 'Telugu'],
          features: ['sentiment', 'hate_speech', 'crime_detection', 'multilingual']
        },
        dataSource: twitterConnected ? 'real' : 'mock',
        lastChecked: new Date().toISOString()
      };
      
      res.json(status);
    } catch (error) {
      console.error("Error checking API status:", error);
      res.status(500).json({ message: "Failed to check API status" });
    }
  });

  // Get district sentiment summary
  app.get("/api/social-media/district-sentiment", async (_req, res) => {
    try {
      const districts = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Adyar', 'Tambaram', 'Central Chennai', 'Mylapore', 'Perungudi'];
      
      const districtSentiments = districts.map(district => {
        const overallSentiment = (Math.random() - 0.5) * 2; // -1 to 1
        const postCount = Math.floor(Math.random() * 50) + 10;
        const positiveCount = Math.floor(postCount * Math.random() * 0.6);
        const negativeCount = Math.floor(postCount * Math.random() * 0.3);
        const neutralCount = postCount - positiveCount - negativeCount;
        
        return {
          district,
          overallSentiment,
          postCount,
          positiveCount,
          neutralCount,
          negativeCount,
          threatLevel: overallSentiment < -0.3 ? 'high' : overallSentiment < 0 ? 'medium' : 'low',
          keyTopics: ['safety', 'police', 'community'].slice(0, Math.floor(Math.random() * 3) + 1)
        };
      });
      
      res.json(districtSentiments);
    } catch (error) {
      console.error("Error fetching district sentiments:", error);
      res.status(500).json({ message: "Failed to fetch district sentiments" });
    }
  });

  // MongoDB Crime Data API routes
  
  // Get crime data with filters
  app.get("/api/mongodb/crime-data", async (req, res) => {
    try {
      const { crimeType, severity, ward, dateFrom, dateTo, limit } = req.query;
      
      const filters = {
        crimeType: crimeType as string,
        severity: severity as string,
        ward: ward as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const data = await mongoDBService.getCrimeData(filters);
      res.json(data);
    } catch (error) {
      console.error("Error fetching crime data from MongoDB:", error);
      res.status(500).json({ message: "Failed to fetch crime data" });
    }
  });

  // Get crime statistics by district
  app.get("/api/mongodb/crime-stats/districts", async (_req, res) => {
    try {
      const stats = await mongoDBService.getCrimeStatsByDistrict();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching crime stats by district:", error);
      res.status(500).json({ message: "Failed to fetch district crime statistics" });
    }
  });

  // Get crime statistics by type
  app.get("/api/mongodb/crime-stats/types", async (_req, res) => {
    try {
      const stats = await mongoDBService.getCrimeStatsByType();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching crime stats by type:", error);
      res.status(500).json({ message: "Failed to fetch crime type statistics" });
    }
  });

  // Get crime hotspots
  app.get("/api/mongodb/crime-hotspots", async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      const hotspots = await mongoDBService.getCrimeHotspots(parseInt(limit as string));
      res.json(hotspots);
    } catch (error) {
      console.error("Error fetching crime hotspots:", error);
      res.status(500).json({ message: "Failed to fetch crime hotspots" });
    }
  });

  // Get total crime count
  app.get("/api/mongodb/total-crimes", async (_req, res) => {
    try {
      const count = await mongoDBService.getTotalCrimeCount();
      res.json({ totalCrimes: count });
    } catch (error) {
      console.error("Error fetching total crime count:", error);
      res.status(500).json({ message: "Failed to fetch total crime count" });
    }
  });

  // Get crime data for map visualization
  app.get("/api/mongodb/map-data", async (req, res) => {
    try {
      const { crimeType, severity, ward, district, limit } = req.query;
      
      let finalWard = ward as string;
      
      // If district is provided instead of ward, convert district to wards
      if (district && district !== 'all') {
        const wardList = Object.entries(WARD_TO_DISTRICT_MAPPING)
          .filter(([, info]) => info.district.toLowerCase().replace(/\s+/g, '-') === district)
          .map(([wardName]) => wardName);
        
        if (wardList.length > 0) {
          // For now, we'll get data for all wards in the district
          // In a real implementation, you might want to modify getCrimeDataForMap to handle multiple wards
          const allWardData = await Promise.all(
            wardList.map(wardName => 
              mongoDBService.getCrimeDataForMap({
                crimeType: crimeType as string,
                severity: severity as string,
                ward: wardName,
                limit: limit ? Math.floor(parseInt(limit as string) / wardList.length) : undefined
              })
            )
          );
          
          const combinedData = allWardData.flat();
          res.json(combinedData);
          return;
        }
      }
      
      const filters = {
        crimeType: crimeType as string,
        severity: severity as string,
        ward: finalWard,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const data = await mongoDBService.getCrimeDataForMap(filters);
      res.json(data);
    } catch (error) {
      console.error("Error fetching map data from MongoDB:", error);
      res.status(500).json({ message: "Failed to fetch map data" });
    }
  });

  // Get enhanced dashboard data with MongoDB integration
  app.get("/api/mongodb/dashboard", async (_req, res) => {
    try {
      const [districtStats, typeStats, totalCount, hotspots, alerts, insights] = await Promise.all([
        mongoDBService.getCrimeStatsByDistrict(),
        mongoDBService.getCrimeStatsByType(),
        mongoDBService.getTotalCrimeCount(),
        mongoDBService.getCrimeHotspots(20),
        storage.getCrimeAlerts(true),
        storage.getAiInsights()
      ]);

      // Transform data to match frontend expectations
      const districts = districtStats.map(stat => ({
        id: stat.district.toLowerCase().replace(/\s+/g, '-'),
        name: stat.district,
        region: stat.region,
        population: stat.population,
        totalIncidents: stat.totalIncidents,
        avgLatitude: stat.avgLatitude,
        avgLongitude: stat.avgLongitude,
        highSeverityCount: stat.highSeverityCount,
        mediumSeverityCount: stat.mediumSeverityCount,
        lowSeverityCount: stat.lowSeverityCount
      }));

      const crimeStats = typeStats.map(stat => ({
        category: {
          id: stat.crimeType.toLowerCase().replace(/\s+/g, '-'),
          name: stat.crimeType.toUpperCase(),
          icon: getCrimeIcon(stat.crimeType),
          color: getCrimeColor(stat.crimeType)
        },
        incidents: [],
        totalCount: stat.totalIncidents,
        changePercent: Math.random() * 40 - 20, // Mock change percentage
        hotspots: stat.wards.slice(0, 3),
        monthlyData: generateMonthlyData(stat.totalIncidents)
      }));

      const dashboardData = {
        totalIncidents: totalCount,
        clearanceRate: 73.2, // Mock clearance rate
        crimeStats,
        districts,
        alerts,
        insights,
        hotspots
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching enhanced dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // FIR API routes
  
  // Submit FIR
  app.post("/api/submit-fir", async (req, res) => {
    try {
      const firData = req.body;
      
      // Validate required fields
      const requiredFields = [
        'complainantName', 'fatherHusbandName', 'age', 'gender', 
        'address', 'phone', 'incidentDate', 'incidentLocation', 
        'policeStation', 'crimeType', 'description'
      ];
      
      const missingFields = requiredFields.filter(field => !firData[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      const result = await mongoDBService.submitFIR(firData);
      res.json(result);
    } catch (error) {
      console.error("Error submitting FIR:", error);
      res.status(500).json({ message: "Failed to submit FIR" });
    }
  });

  // Get FIR by ID
  app.get("/api/fir/:firId", async (req, res) => {
    try {
      const { firId } = req.params;
      const fir = await mongoDBService.getFIRById(firId);
      res.json(fir);
    } catch (error) {
      console.error("Error fetching FIR:", error);
      if (error.message === 'FIR not found') {
        res.status(404).json({ message: "FIR not found" });
      } else {
        res.status(500).json({ message: "Failed to fetch FIR" });
      }
    }
  });

  // Get FIR by number
  app.get("/api/fir/number/:firNumber", async (req, res) => {
    try {
      const { firNumber } = req.params;
      const fir = await mongoDBService.getFIRByNumber(firNumber);
      res.json(fir);
    } catch (error) {
      console.error("Error fetching FIR by number:", error);
      if (error.message === 'FIR not found') {
        res.status(404).json({ message: "FIR not found" });
      } else {
        res.status(500).json({ message: "Failed to fetch FIR" });
      }
    }
  });

  // Get all FIRs with filtering
  app.get("/api/firs", async (req, res) => {
    try {
      const { status, crimeType, policeStation, dateFrom, dateTo, limit = '50', skip = '0' } = req.query;
      
      const filters = {
        status: status as string,
        crimeType: crimeType as string,
        policeStation: policeStation as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string)
      };
      
      const result = await mongoDBService.getAllFIRs(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching FIRs:", error);
      res.status(500).json({ message: "Failed to fetch FIRs" });
    }
  });

  // Update FIR status
  app.put("/api/fir/:firId/status", async (req, res) => {
    try {
      const { firId } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedFIR = await mongoDBService.updateFIRStatus(firId, status);
      res.json(updatedFIR);
    } catch (error) {
      console.error("Error updating FIR status:", error);
      if (error.message === 'FIR not found') {
        res.status(404).json({ message: "FIR not found" });
      } else {
        res.status(500).json({ message: "Failed to update FIR status" });
      }
    }
  });

  // Generate PDF for FIR
  app.get("/api/generate-pdf/:firId", async (req, res) => {
    try {
      const { firId } = req.params;
      const fir = await mongoDBService.getFIRById(firId);
      
      // Generate PDF content
      const pdfBuffer = await generateFIRPDF(fir);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="FIR_${fir.firNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating FIR PDF:", error);
      if (error.message === 'FIR not found') {
        res.status(404).json({ message: "FIR not found" });
      } else {
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
