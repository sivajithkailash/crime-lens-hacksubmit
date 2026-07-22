import { TwitterApi, TweetV2, UserV2 } from 'twitter-api-v2';
import { nlpService } from './nlpService';

interface TwitterPost {
  id: string;
  platform: 'twitter';
  content: string;
  author: string;
  authorHandle: string;
  timestamp: Date;
  location?: string;
  district: string;
  metrics: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  verified: boolean;
  language?: string;
}

interface TwitterSearchParams {
  query: string;
  location?: string;
  maxResults?: number;
  language?: string;
}

export class TwitterService {
  private client!: TwitterApi;
  private isInitialized = false;
  private lastErrorLogged = 0;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!bearerToken) {
      console.warn('Twitter Bearer Token not found. Twitter integration will use mock data.');
      return;
    }

    try {
      if (apiKey && apiSecret && accessToken && accessSecret) {
        // Full OAuth 1.0a client (can read, write, and access DMs)
        this.client = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessSecret,
        });
      } else {
        // Bearer token only (read-only)
        this.client = new TwitterApi(bearerToken);
      }

      this.isInitialized = true;
      console.log('Twitter API service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Twitter API:', error);
    }
  }

  async searchTweets(params: TwitterSearchParams): Promise<TwitterPost[]> {
    if (!this.isInitialized || !this.client) {
      console.log('Twitter API not available, returning mock data');
      return this.getMockData();
    }

    try {
      const { query, location, maxResults = 50, language } = params;
      
      // Build search query
      let searchQuery = query;
      if (location) {
        searchQuery += ` (${location} OR near:"${location}")`;
      }
      
      // Add common Chennai-related terms to improve relevance
      if (location?.toLowerCase().includes('chennai')) {
        searchQuery += ' (Chennai OR "Chennai Police" OR "TN Police" OR "Tamil Nadu")';
      }
      
      // Exclude retweets for better quality
      searchQuery += ' -is:retweet';

      const searchParams: any = {
        query: searchQuery,
        max_results: Math.min(maxResults, 100), // Twitter API limit
        'tweet.fields': [
          'created_at',
          'public_metrics',
          'context_annotations',
          'lang',
          'geo',
          'author_id',
          'conversation_id'
        ].join(','),
        'user.fields': [
          'verified',
          'public_metrics',
          'name',
          'username',
          'location'
        ].join(','),
        'place.fields': 'full_name,country,place_type',
        expansions: 'author_id,geo.place_id'
      };

      if (language) {
        searchParams.lang = language;
      }

      console.log('Searching Twitter with query:', searchQuery);
      const response = await this.client.v2.search(searchQuery, searchParams);

      if (!response.data?.data?.length) {
        console.log('No tweets found, returning mock data');
        return this.getMockData();
      }

      // Process tweets
      const tweets: TwitterPost[] = [];
      const users = new Map();
      const places = new Map();

      // Build lookup maps
      if (response.data.includes?.users) {
        response.data.includes.users.forEach(user => {
          users.set(user.id, user);
        });
      }

      if (response.data.includes?.places) {
        response.data.includes.places.forEach(place => {
          places.set(place.id, place);
        });
      }

      for (const tweet of response.data.data) {
        const author = users.get(tweet.author_id);
        const place = tweet.geo?.place_id ? places.get(tweet.geo.place_id) : null;
        
        // Determine district/location
        let district = 'Chennai'; // Default
        if (place?.full_name) {
          district = this.extractDistrict(place.full_name);
        } else if (author?.location) {
          district = this.extractDistrict(author.location);
        }

        const twitterPost: TwitterPost = {
          id: tweet.id,
          platform: 'twitter',
          content: tweet.text,
          author: author?.name || 'Unknown User',
          authorHandle: `@${author?.username || 'unknown'}`,
          timestamp: new Date(tweet.created_at!),
          location: place?.full_name || author?.location || undefined,
          district,
          metrics: {
            likes: tweet.public_metrics?.like_count || 0,
            shares: tweet.public_metrics?.retweet_count || 0,
            comments: tweet.public_metrics?.reply_count || 0,
            reach: tweet.public_metrics?.impression_count || 
                   (tweet.public_metrics?.like_count || 0) * 10 // Estimate if not available
          },
          verified: author?.verified || false,
          language: tweet.lang
        };

        tweets.push(twitterPost);
      }

      console.log(`Successfully fetched ${tweets.length} tweets from Twitter API`);
      return tweets;

    } catch (error: any) {
      // Only log first occurrence to avoid spam
      if (!this.lastErrorLogged || Date.now() - this.lastErrorLogged > 60000) { // 1 minute
        if (error.code === 429) {
          console.log('Twitter API rate limit hit, returning cached/mock data');
        } else if (error.code === 403) {
          console.log('Twitter API access restricted. Using mock data. Check API permissions.');
        } else {
          console.error('Error fetching tweets:', error?.message || 'Unknown error');
        }
        this.lastErrorLogged = Date.now();
      }
      
      // Return mock data as fallback
      return this.getMockData();
    }
  }

  private extractDistrict(location: string): string {
    const districts = [
      'Anna Nagar', 'T.Nagar', 'Velachery', 'Adyar', 'Tambaram', 
      'Central Chennai', 'Mylapore', 'Perungudi', 'Guindy', 'Nungambakkam',
      'Kodambakkam', 'Saidapet', 'Porur', 'OMR', 'ECR', 'Sholinganallur'
    ];

    const lowerLocation = location.toLowerCase();
    
    for (const district of districts) {
      if (lowerLocation.includes(district.toLowerCase())) {
        return district;
      }
    }

    // Check for common Chennai area names
    if (lowerLocation.includes('chennai') || lowerLocation.includes('madras')) {
      return 'Chennai';
    }

    return 'Chennai'; // Default fallback
  }

  private getMockData(): TwitterPost[] {
    // Return existing mock data as fallback
    const districts = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Adyar', 'Tambaram', 'Central Chennai', 'Mylapore', 'Perungudi'];
    const samplePosts = [
      "Police response was very quick in T.Nagar today. Impressed with Chennai Police! 👮‍♂️ #ChennaiPolice #Safety",
      "சென்னை போலீஸ் மிக நல்லா வேலை செய்யுறாங்க. வேலூர் பகுதியில் பாதுகாப்பு நல்லா இருக்கு #சென்னைபோலீஸ்",
      "Street lights not working in Anna Nagar for 3 days. Safety concern for women walking at night #ChennaiCorp",
      "Witnessed a theft near Marina Beach. Police arrived within 10 minutes! Great job @ChennaiPolice",
      "Traffic police doing excellent work managing rush hour traffic in Velachery #Traffic #Chennai",
      "Community policing initiative in Tambaram is working well. Neighbors are more connected now 🏘️",
      "Concerned about increasing vehicle thefts in IT corridor. Need more patrol cars #Safety #Velachery",
      "Kudos to Chennai Police for quick action on cyber crime complaint. Very professional service! 💻"
    ];

    return Array.from({ length: 20 }, (_, index) => {
      const district = districts[Math.floor(Math.random() * districts.length)];
      const content = samplePosts[Math.floor(Math.random() * samplePosts.length)];

      return {
        id: `mock-${index}`,
        platform: 'twitter' as const,
        content,
        author: `User${Math.floor(Math.random() * 1000)}`,
        authorHandle: `@user${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        district,
        metrics: {
          likes: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
          reach: Math.floor(Math.random() * 10000) + 1000
        },
        verified: Math.random() > 0.8,
        language: Math.random() > 0.7 ? 'en' : ['ta', 'hi', 'te'][Math.floor(Math.random() * 3)]
      };
    });
  }

  async getTrendingTopics(location = 'Chennai'): Promise<any[]> {
    if (!this.isInitialized || !this.client) {
      return this.getMockTrends();
    }

    try {
      // Get trends for Chennai (WOEID: 2295424) or closest available
      const trends = await this.client.v1.trendsAvailable();
      const chennaiTrend = trends.find(t => 
        t.name.toLowerCase().includes('chennai') || 
        t.country?.toLowerCase() === 'india'
      );

      if (chennaiTrend) {
        const trendsData = await this.client.v1.trendsByPlace(chennaiTrend.woeid);
        return trendsData[0]?.trends?.slice(0, 10).map((trend: any) => ({
          keyword: trend.name,
          volume: trend.tweet_volume || Math.floor(Math.random() * 10000) + 1000,
          sentiment: (Math.random() - 0.5) * 2, // -1 to 1
          growth: (Math.random() - 0.3) * 100, // Simulate growth percentage
          locations: ['Chennai'],
          category: this.categorizeTrend(trend.name)
        })) || this.getMockTrends();
      }

      return this.getMockTrends();
    } catch (error: any) {
      // Only log trend errors occasionally
      if (!this.lastErrorLogged || Date.now() - this.lastErrorLogged > 300000) { // 5 minutes
        console.log('Error fetching Twitter trends, using mock data:', error?.message || 'Unknown error');
      }
      return this.getMockTrends();
    }
  }

  private categorizeTrend(trendName: string): string {
    const lowerName = trendName.toLowerCase();
    
    if (lowerName.includes('police') || lowerName.includes('cop')) return 'police';
    if (lowerName.includes('crime') || lowerName.includes('theft') || lowerName.includes('safety')) return 'crime';
    if (lowerName.includes('traffic') || lowerName.includes('road')) return 'safety';
    if (lowerName.includes('emergency') || lowerName.includes('alert')) return 'emergency';
    
    return 'community';
  }

  private getMockTrends() {
    return [
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
      }
    ];
  }

  // Check if Twitter API is available
  isAvailable(): boolean {
    return this.isInitialized && !!this.client;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client.v2.me();
      return true;
    } catch (error) {
      console.error('Twitter API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const twitterService = new TwitterService();
