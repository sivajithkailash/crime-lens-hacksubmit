declare module 'node-nlp' {
  export class NlpManager {
    constructor(options?: {
      languages?: string[];
      forceNER?: boolean;
      nlu?: { useNoneFeature?: boolean };
    });
    addLanguage(language: string): void;
    addDocument(language: string, text: string, intent: string): void;
    train(): Promise<void>;
    save(): Promise<void>;
  }
}
