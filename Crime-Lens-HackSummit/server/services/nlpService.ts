import { NlpManager } from 'node-nlp';
import Sentiment from 'sentiment';
import { franc } from 'franc-min';
import * as natural from 'natural';

interface SentimentResult {
  text: string;
  language: string;
  sentiment: {
    score: number;
    comparative: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  hateSpeech: {
    detected: boolean;
    confidence: number;
    categories: string[];
  };
  entities?: any[];
  keywords: string[];
  crimeRelated: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram';
  content: string;
  author: string;
  authorHandle: string;
  timestamp: Date;
  location?: string;
  district: string;
  language?: string;
  metrics?: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  verified?: boolean;
}

export class NLPService {
  private nlpManager!: NlpManager;
  private sentimentAnalyzer: any;
  private isInitialized: boolean = false;
  private crimeKeywords!: Set<string>;
  private hateSpeechKeywords!: Set<string>;
  private tamilSentimentWords!: Map<string, number>;
  private hindiSentimentWords!: Map<string, number>;
  private teluguSentimentWords!: Map<string, number>;

  constructor() {
    this.initializeKeywords();
    this.initializeMultilingualSentiments();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize NLP Manager
    this.nlpManager = new NlpManager({
      languages: ['en', 'ta', 'hi', 'te'],
      forceNER: true,
      nlu: { useNoneFeature: true }
    });

    // Initialize English sentiment analyzer
    this.sentimentAnalyzer = new Sentiment();

    // Add custom sentiment words for better accuracy
    this.addCustomSentimentWords();

    // Train multilingual models
    await this.trainMultilingualModels();

    this.isInitialized = true;
    console.log('NLP Service initialized successfully');
  }

  private initializeKeywords(): void {
    this.crimeKeywords = new Set([
      'police', 'crime', 'theft', 'robbery', 'burglary', 'assault', 'murder',
      'kidnap', 'fraud', 'scam', 'drug', 'violence', 'weapon', 'gun', 'knife',
      'arrest', 'jail', 'court', 'law', 'legal', 'illegal', 'criminal',
      'safety', 'security', 'danger', 'threat', 'emergency', 'help',
      // Tamil words
      'போலீஸ்', 'குற்றம்', 'திருட்டு', 'கொள்ளை', 'வன்முறை', 'ஆபத்து', 'பாதுகாப்பு',
      // Hindi words  
      'पुलिस', 'अपराध', 'चोरी', 'लूट', 'हिंसा', 'खतरा', 'सुरक्षा',
      // Telugu words
      'పోలీస్', 'నేరం', 'దొంగతనం', 'దోపిడీ', 'హింస', 'ప్రమాదం', 'భద్రత'
    ]);

    this.hateSpeechKeywords = new Set([
      'hate', 'kill', 'die', 'murder', 'attack', 'destroy', 'bomb',
      'terrorist', 'violence', 'threat', 'revenge', 'enemy', 'war',
      'stupid', 'idiot', 'fool', 'worthless', 'useless', 'disgusting',
      // Common abuse patterns (be careful with these in production)
      'damn', 'hell', 'bloody', 'bastard', 'bitch'
    ]);
  }

  private initializeMultilingualSentiments(): void {
    // Tamil sentiment words
    this.tamilSentimentWords = new Map([
      ['நல்ல', 2], ['அருமை', 3], ['சிறப்பு', 2], ['மகிழ்ச்சி', 3],
      ['நன்றி', 2], ['வாழ்த்து', 2], ['பாராட்டு', 2],
      ['மோசம்', -2], ['கெட்ட', -2], ['பிரச்சனை', -1], ['கோபம்', -2],
      ['வருத்தம்', -1], ['ஆபத்து', -3], ['எரிச்சல்', -1]
    ]);

    // Hindi sentiment words
    this.hindiSentimentWords = new Map([
      ['अच्छा', 2], ['बेहतरीन', 3], ['शानदार', 3], ['खुशी', 3],
      ['धन्यवाद', 2], ['बधाई', 2], ['तारीफ', 2],
      ['बुरा', -2], ['गलत', -2], ['समस्या', -1], ['गुस्सा', -2],
      ['दुख', -1], ['खतरा', -3], ['परेशानी', -1]
    ]);

    // Telugu sentiment words
    this.teluguSentimentWords = new Map([
      ['మంచి', 2], ['అద్భుతం', 3], ['చాలా బాగుంది', 3], ['సంతోషం', 3],
      ['ధన్యవాదాలు', 2], ['అభినందనలు', 2], ['ప్రశంసలు', 2],
      ['చెడ్డది', -2], ['తప్పు', -2], ['సమస్య', -1], ['కోపం', -2],
      ['బాధ', -1], ['ప్రమాదం', -3], ['ఇబ్బంది', -1]
    ]);
  }

  private addCustomSentimentWords(): void {
    // Safely add custom sentiment words if afinn exists
    try {
      if (this.sentimentAnalyzer && this.sentimentAnalyzer.afinn) {
        // Add police and crime related positive words
        this.sentimentAnalyzer.afinn['police'] = 1;
        this.sentimentAnalyzer.afinn['officer'] = 1;
        this.sentimentAnalyzer.afinn['safety'] = 2;
        this.sentimentAnalyzer.afinn['security'] = 2;
        this.sentimentAnalyzer.afinn['protection'] = 2;
        this.sentimentAnalyzer.afinn['help'] = 2;
        this.sentimentAnalyzer.afinn['rescue'] = 3;
        this.sentimentAnalyzer.afinn['justice'] = 2;

        // Add crime related negative words
        this.sentimentAnalyzer.afinn['crime'] = -2;
        this.sentimentAnalyzer.afinn['criminal'] = -2;
        this.sentimentAnalyzer.afinn['theft'] = -3;
        this.sentimentAnalyzer.afinn['robbery'] = -3;
        this.sentimentAnalyzer.afinn['murder'] = -4;
        this.sentimentAnalyzer.afinn['assault'] = -3;
        this.sentimentAnalyzer.afinn['violence'] = -3;
        this.sentimentAnalyzer.afinn['danger'] = -2;
        this.sentimentAnalyzer.afinn['threat'] = -3;
      }
    } catch (error) {
      console.warn('Could not add custom sentiment words:', error);
    }
  }

  private async trainMultilingualModels(): Promise<void> {
    // Tamil training data
    this.nlpManager.addLanguage('ta');
    this.nlpManager.addDocument('ta', 'போலீஸ் நல்லா வேலை செய்யுறாங்க', 'positive');
    this.nlpManager.addDocument('ta', 'பாதுகாப்பு மிக சிறப்பா இருக்கு', 'positive');
    this.nlpManager.addDocument('ta', 'அவசர காலத்துல உடனே வந்தாங்க', 'positive');
    this.nlpManager.addDocument('ta', 'திருட்டு நடந்திருக்கு பயமா இருக்கு', 'negative');
    this.nlpManager.addDocument('ta', 'ரொம்ப மோசமான சம்பவம்', 'negative');
    this.nlpManager.addDocument('ta', 'என்ன பண்ணுறாங்க தெரியலை', 'neutral');

    // Hindi training data
    this.nlpManager.addLanguage('hi');
    this.nlpManager.addDocument('hi', 'पुलिस बहुत अच्छा काम कर रही है', 'positive');
    this.nlpManager.addDocument('hi', 'सुरक्षा बहुत बेहतरीन है', 'positive');
    this.nlpManager.addDocument('hi', 'चोरी हो गई बहुत डर लग रहा', 'negative');
    this.nlpManager.addDocument('hi', 'बुरी घटना हुई है', 'negative');
    this.nlpManager.addDocument('hi', 'क्या हो रहा है पता नहीं', 'neutral');

    // Telugu training data
    this.nlpManager.addLanguage('te');
    this.nlpManager.addDocument('te', 'పోలీసులు చాలా బాగా పని చేస్తున్నారు', 'positive');
    this.nlpManager.addDocument('te', 'భద్రత చాలా మెరుగ్గా ఉంది', 'positive');
    this.nlpManager.addDocument('te', 'దొంగతనం జరిగింది భయం వేస్తోంది', 'negative');
    this.nlpManager.addDocument('te', 'చెడ్డ సంఘటన జరిగింది', 'negative');
    this.nlpManager.addDocument('te', 'ఏమి జరుగుతుందో తెలియదు', 'neutral');

    // Train the model
    await this.nlpManager.train();
    await this.nlpManager.save();
    console.log('Multilingual models trained successfully');
  }

  detectLanguage(text: string): string {
    // Use franc for language detection
    const detected = franc(text);
    
    // Map ISO codes to our supported languages
    const languageMap: { [key: string]: string } = {
      'eng': 'en',
      'tam': 'ta', 
      'hin': 'hi',
      'tel': 'te',
      'und': 'en' // Default to English if undetermined
    };

    return languageMap[detected] || 'en';
  }

  analyzeSentimentMultilingual(text: string, language: string): {
    score: number;
    comparative: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  } {
    let score = 0;
    let comparative = 0;
    let confidence = 0.7;

    if (language === 'en') {
      const result = this.sentimentAnalyzer.analyze(text);
      score = result.score;
      comparative = result.comparative;
      confidence = Math.min(Math.abs(comparative) * 10 + 0.5, 1);
    } else {
      // Use our multilingual sentiment dictionaries
      const words = text.toLowerCase().split(/\s+/);
      let wordCount = 0;
      let totalScore = 0;

      const sentimentMap = language === 'ta' ? this.tamilSentimentWords :
                          language === 'hi' ? this.hindiSentimentWords :
                          language === 'te' ? this.teluguSentimentWords :
                          new Map();

      words.forEach(word => {
        if (sentimentMap.has(word)) {
          totalScore += sentimentMap.get(word)!;
          wordCount++;
        }
      });

      if (wordCount > 0) {
        score = totalScore;
        comparative = totalScore / words.length;
        confidence = Math.min(wordCount / words.length + 0.4, 1);
      } else {
        // Fallback to English analysis for mixed language content
        const englishResult = this.sentimentAnalyzer.analyze(text);
        score = englishResult.score * 0.7; // Reduce confidence for cross-language
        comparative = englishResult.comparative * 0.7;
        confidence = 0.4;
      }
    }

    const label: 'positive' | 'negative' | 'neutral' = 
      comparative > 0.1 ? 'positive' : 
      comparative < -0.1 ? 'negative' : 'neutral';

    return { score, comparative, label, confidence };
  }

  detectHateSpeech(text: string): {
    detected: boolean;
    confidence: number;
    categories: string[];
  } {
    const lowerText = text.toLowerCase();
    let hatefulWords = 0;
    let totalWords = text.split(/\s+/).length;
    const categories: string[] = [];

    // Check for hate speech keywords
    for (const keyword of Array.from(this.hateSpeechKeywords)) {
      if (lowerText.includes(keyword)) {
        hatefulWords++;
        
        // Categorize hate speech types
        if (['kill', 'murder', 'die', 'bomb', 'attack'].includes(keyword)) {
          categories.push('threats');
        } else if (['stupid', 'idiot', 'fool', 'worthless'].includes(keyword)) {
          categories.push('harassment');
        } else if (['hate', 'enemy', 'destroy'].includes(keyword)) {
          categories.push('hostility');
        }
      }
    }

    // Simple pattern matching for aggressive language
    const aggressivePatterns = [
      /kill\s+you/i,
      /i\s+hate/i,
      /go\s+die/i,
      /you\s+suck/i,
      /shut\s+up/i
    ];

    aggressivePatterns.forEach(pattern => {
      if (pattern.test(text)) {
        hatefulWords++;
        categories.push('aggressive');
      }
    });

    const confidence = Math.min(hatefulWords / totalWords * 3, 1);
    const detected = confidence > 0.3 || hatefulWords > 0;

    return {
      detected,
      confidence,
      categories: Array.from(new Set(categories)) // Remove duplicates
    };
  }

  isCrimeRelated(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    for (const keyword of Array.from(this.crimeKeywords)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  extractKeywords(text: string, language: string): string[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Use natural.stopwords if available, otherwise use fallback English stopwords
    const stopwords = natural.stopwords || [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
      'have', 'had', 'what', 'said', 'each', 'which', 'their', 'time',
      'will', 'about', 'if', 'up', 'out', 'many', 'then', 'them', 'these',
      'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'has',
      'two', 'more', 'very', 'after', 'words', 'long', 'than', 'first',
      'been', 'call', 'who', 'oil', 'now', 'find', 'could', 'made', 'may',
      'part', 'over', 'new', 'sound', 'take', 'only', 'little', 'work',
      'know', 'place', 'year', 'live', 'me', 'back', 'give', 'most',
      'very', 'good', 'man', 'old', 'see', 'way', 'day', 'get', 'use',
      'water', 'farm', 'they', 'say', 'she', 'may', 'use', 'her', 'there',
      'each', 'which', 'do', 'how', 'their', 'if', 'will', 'up', 'other',
      'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
      'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'two',
      'more', 'write', 'go', 'see', 'no', 'number', 'way', 'could', 'people',
      'my', 'than', 'first', 'water', 'been', 'call', 'who', 'its', 'now',
      'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may',
      'part'
    ];
    
    // Filter out stopwords and get meaningful keywords
    const keywords = words
      .filter(word => word.length > 2)
      .filter(word => !stopwords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 keywords

    return keywords;
  }

  calculateThreatLevel(sentiment: any, hateSpeech: any, crimeRelated: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (hateSpeech.detected && hateSpeech.confidence > 0.7) {
      return 'critical';
    }

    if (hateSpeech.detected || (crimeRelated && sentiment.label === 'negative' && sentiment.confidence > 0.7)) {
      return 'high';
    }

    if (crimeRelated && sentiment.label === 'negative') {
      return 'medium';
    }

    return 'low';
  }

  async analyzeSocialMediaPost(post: SocialMediaPost): Promise<SentimentResult> {
    await this.initialize();

    // Validate post content
    if (!post || typeof post.content !== 'string' || post.content.trim().length === 0) {
      throw new Error('Invalid post: content is required and must be a non-empty string');
    }

    try {
      // Detect language
      const language = post.language || this.detectLanguage(post.content);

      // Analyze sentiment
      const sentiment = this.analyzeSentimentMultilingual(post.content, language);

      // Detect hate speech
      const hateSpeech = this.detectHateSpeech(post.content);

      // Check if crime related
      const crimeRelated = this.isCrimeRelated(post.content);

      // Extract keywords
      const keywords = this.extractKeywords(post.content, language);

      // Calculate threat level
      const threatLevel = this.calculateThreatLevel(sentiment, hateSpeech, crimeRelated);

      return {
        text: post.content,
        language,
        sentiment,
        hateSpeech,
        keywords,
        crimeRelated,
        threatLevel
      };
    } catch (error) {
      console.error('Error in NLP analysis for post:', post.id, error);
      // Return safe fallback values
      return {
        text: post.content,
        language: 'en',
        sentiment: {
          score: 0,
          comparative: 0,
          label: 'neutral',
          confidence: 0.5
        },
        hateSpeech: {
          detected: false,
          confidence: 0,
          categories: []
        },
        keywords: [],
        crimeRelated: false,
        threatLevel: 'low'
      };
    }
  }

  async batchAnalyzePosts(posts: SocialMediaPost[]): Promise<SentimentResult[]> {
    await this.initialize();
    
    const results = await Promise.all(
      posts.map(post => this.analyzeSocialMediaPost(post))
    );

    return results;
  }

  // Utility method to get language name from code
  getLanguageName(code: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'ta': 'Tamil',
      'hi': 'Hindi',
      'te': 'Telugu'
    };

    return languageNames[code] || 'Unknown';
  }
}

// Singleton instance
export const nlpService = new NLPService();
