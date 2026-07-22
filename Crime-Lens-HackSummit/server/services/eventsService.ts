export interface PredictHQEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  start: string;
  end?: string;
  location?: {
    name?: string;
    address?: string;
    coordinates?: [number, number];
  };
  rank: number;
  local_rank?: number;
  phq_attendance?: number;
  predicted_event_spend?: number;
  impact_patterns?: any;
  relevance?: number;
}

export interface EventsResponse {
  count: number;
  results: PredictHQEvent[];
  next?: string;
  previous?: string;
}

class EventsService {
  private readonly apiToken: string;
  private readonly baseUrl = 'https://api.predicthq.com/v1';

  constructor() {
    this.apiToken = process.env.PREDICTHQ_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('PredictHQ API token not found. Events feature will not work.');
    }
  }

  /**
   * Fetch major events in Chennai for the upcoming week
   * Filters for high-impact events that might affect police operations
   */
  async fetchChennaiEvents(): Promise<EventsResponse> {
    if (!this.apiToken) {
      throw new Error('PredictHQ API token not configured');
    }

    try {
      // Calculate date range for upcoming week
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      // Chennai coordinates and radius
      const chennaiLat = 13.0827;
      const chennaiLon = 80.2707;
      const radiusKm = 50; // 50km radius to cover Chennai metropolitan area

      // Build query parameters
      const params = new URLSearchParams({
        // Location filter for Chennai area
        'within': `${radiusKm}km@${chennaiLat},${chennaiLon}`,
        
        // Date range for upcoming week
        'active.gte': now.toISOString().split('T')[0],
        'active.lte': nextWeek.toISOString().split('T')[0],
        
        // Focus on major events that could impact police operations
        'rank.gte': '60', // High-impact events only
        
        // Categories relevant to police operations
        'category': [
          'concerts',
          'conferences', 
          'expos',
          'festivals',
          'performing-arts',
          'sports',
          'community',
          'academic'
        ].join(','),
        
        // Sort by relevance and rank
        'sort': 'rank,-start',
        
        // Limit results
        'limit': '20',
        
        // Include important fields
        'relevance': 'rank,local_rank'
      });

      const response = await fetch(`${this.baseUrl}/events/?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PredictHQ API error: ${response.status} - ${errorText}`);
      }

      const data: EventsResponse = await response.json();

      // Transform and enrich the data
      data.results = data.results.map(event => ({
        ...event,
        // Ensure we have clean data
        title: event.title || 'Unknown Event',
        category: this.getCategoryDisplayName(event.category),
        // Format location data
        location: {
          name: event.location?.name,
          address: event.location?.address,
          coordinates: event.location?.coordinates
        }
      }));

      return data;

    } catch (error) {
      console.error('Error fetching Chennai events:', error);
      throw error;
    }
  }

  /**
   * Get human-readable category names
   */
  private getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'concerts': 'Concerts & Music',
      'conferences': 'Conferences',
      'expos': 'Exhibitions & Expos',
      'festivals': 'Festivals',
      'performing-arts': 'Performing Arts',
      'sports': 'Sports Events',
      'community': 'Community Events',
      'academic': 'Academic Events'
    };

    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get event impact level based on rank
   */
  static getImpactLevel(rank: number): 'Low' | 'Medium' | 'High' | 'Very High' {
    if (rank >= 81) return 'Very High';
    if (rank >= 61) return 'High';
    if (rank >= 41) return 'Medium';
    return 'Low';
  }

  /**
   * Format attendance numbers
   */
  static formatAttendance(attendance?: number): string {
    if (!attendance) return 'N/A';
    if (attendance >= 1000000) return `${(attendance / 1000000).toFixed(1)}M`;
    if (attendance >= 1000) return `${(attendance / 1000).toFixed(1)}K`;
    return attendance.toString();
  }

  /**
   * Format event spend
   */
  static formatEventSpend(spend?: number): string {
    if (!spend) return 'N/A';
    if (spend >= 1000000) return `$${(spend / 1000000).toFixed(1)}M`;
    if (spend >= 1000) return `$${(spend / 1000).toFixed(1)}K`;
    return `$${spend}`;
  }
}

export default new EventsService();
