declare module 'sentiment' {
  interface SentimentResult {
    score: number;
    comparative: number;
    calculation: any[];
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }
  
  class Sentiment {
    constructor();
    analyze(text: string): SentimentResult;
    afinn: { [key: string]: number };
  }
  
  export = Sentiment;
}
