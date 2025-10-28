// import ZAI from 'z-ai-web-dev-sdk'; // Temporarily commented out - package not available

export interface NLPIntent {
  name: string;
  confidence: number;
  parameters: Record<string, any>;
  context: string;
}

export interface ContextualUnderstanding {
  playerIntent: string;
  emotionalTone: 'neutral' | 'urgent' | 'frustrated' | 'excited' | 'confused';
  urgency: number; // 0-1
  complexity: number; // 0-1
  contextualRelevance: number; // 0-1
  suggestedActions: string[];
}

export interface ConversationState {
  topic: string;
  context: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    intent?: string;
  }>;
  playerMood: 'neutral' | 'stressed' | 'focused' | 'excited' | 'frustrated';
  sessionGoals: string[];
  unresolvedQueries: string[];
}

export class NLPProcessor {
  private zai: any | null = null; // Using any since ZAI package is not available
  private conversationState: ConversationState;
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private contextKeywords: Map<string, string[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.conversationState = {
      topic: 'general',
      context: 'gaming',
      history: [],
      playerMood: 'neutral',
      sessionGoals: [],
      unresolvedQueries: []
    };
    this.initializeIntentPatterns();
    this.initializeContextKeywords();
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns.set('attack', [
      /attack/i,
      /shoot/i,
      /fire/i,
      /engage/i,
      /combat/i,
      /fight/i
    ]);

    this.intentPatterns.set('defend', [
      /defend/i,
      /protect/i,
      /cover/i,
      /shield/i,
      /guard/i,
      /hold/i
    ]);

    this.intentPatterns.set('move', [
      /move/i,
      /go/i,
      /run/i,
      /walk/i,
      /advance/i,
      /retreat/i,
      /fall back/i
    ]);

    this.intentPatterns.set('communicate', [
      /talk/i,
      /chat/i,
      /tell/i,
      /say/i,
      /communicate/i,
      /inform/i
    ]);

    this.intentPatterns.set('help', [
      /help/i,
      /assist/i,
      /support/i,
      /aid/i,
      /rescue/i,
      /heal/i
    ]);

    this.intentPatterns.set('question', [
      /\?$/,
      /what/i,
      /where/i,
      /when/i,
      /why/i,
      /how/i,
      /which/i
    ]);
  }

  private initializeContextKeywords(): void {
    this.contextKeywords.set('combat', [
      'enemy', 'weapon', 'health', 'damage', 'kill', 'death', 'ammo', 'reload'
    ]);

    this.contextKeywords.set('navigation', [
      'location', 'direction', 'position', 'area', 'zone', 'room', 'path'
    ]);

    this.contextKeywords.set('strategy', [
      'plan', 'tactic', 'strategy', 'approach', 'method', 'way', 'technique'
    ]);

    this.contextKeywords.set('social', [
      'team', 'player', 'friend', 'ally', 'enemy', 'partner', 'squad', 'group'
    ]);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize ZAI if available
      if (typeof window !== 'undefined' && (window as any).ZAI) {
        this.zai = new (window as any).ZAI({
          apiKey: process.env.ZAI_API_KEY,
          model: 'gpt-4'
        });
      }

      this.isInitialized = true;
      console.log('NLP Processor initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize ZAI, using fallback methods:', error);
      this.isInitialized = true; // Still mark as initialized with fallback
    }
  }

  async processInput(input: string, context?: string): Promise<NLPIntent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const normalizedInput = input.toLowerCase().trim();
    const detectedIntent = this.detectIntent(normalizedInput);
    const parameters = this.extractParameters(normalizedInput, detectedIntent);
    const contextualRelevance = this.calculateContextualRelevance(normalizedInput, context);

    return {
      name: detectedIntent.name,
      confidence: detectedIntent.confidence,
      parameters,
      context: context || 'general'
    };
  }

  private detectIntent(input: string): { name: string; confidence: number } {
    let bestMatch = { name: 'unknown', confidence: 0 };

    this.intentPatterns.forEach((patterns, intentName) => {
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          const confidence = match.length / input.split(' ').length;
          if (confidence > bestMatch.confidence) {
            bestMatch = { name: intentName, confidence };
          }
        }
      }
    });

    return bestMatch;
  }

  private extractParameters(input: string, intent: { name: string; confidence: number }): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (intent.name) {
      case 'attack':
        parameters.target = this.extractTarget(input);
        parameters.weapon = this.extractWeapon(input);
        break;

      case 'move':
        parameters.direction = this.extractDirection(input);
        parameters.distance = this.extractDistance(input);
        break;

      case 'communicate':
        parameters.recipient = this.extractRecipient(input);
        parameters.message = this.extractMessage(input);
        break;

      case 'help':
        parameters.target = this.extractTarget(input);
        parameters.type = this.extractHelpType(input);
        break;
    }

    return parameters;
  }

  private extractTarget(input: string): string | null {
    const targetPatterns = [
      /(?:attack|engage|help|heal|protect)\s+(\w+)/i,
      /(?:the\s+)?(\w+)(?:\s+is|\s+are)/i
    ];

    for (const pattern of targetPatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractWeapon(input: string): string | null {
    const weaponPatterns = [
      /(?:use|with|equip|switch\s+to)\s+(\w+)/i,
      /(?:shoot|fire)\s+(\w+)/i
    ];

    for (const pattern of weaponPatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractDirection(input: string): string | null {
    const directions = ['north', 'south', 'east', 'west', 'up', 'down', 'left', 'right', 'forward', 'backward'];

    for (const direction of directions) {
      if (input.includes(direction)) {
        return direction;
      }
    }

    return null;
  }

  private extractDistance(input: string): number | null {
    const distancePatterns = [
      /(\d+)\s*(?:feet|meters|units?|steps?)/i,
      /(?:short|medium|long)\s+distance/i
    ];

    for (const pattern of distancePatterns) {
      const match = input.match(pattern);
      if (match) {
        if (match[1]) {
          return parseInt(match[1]);
        } else {
          // Convert descriptive distances to approximate values
          if (input.includes('short')) return 10;
          if (input.includes('medium')) return 25;
          if (input.includes('long')) return 50;
        }
      }
    }

    return null;
  }

  private extractRecipient(input: string): string | null {
    const recipientPatterns = [
      /(?:tell|ask|inform)\s+(\w+)/i,
      /(\w+),?\s+(?:please\s+)?(?:tell|ask)/i
    ];

    for (const pattern of recipientPatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractMessage(input: string): string | null {
    // Extract the message part after removing command patterns
    const cleanInput = input.replace(/(?:tell|ask|inform)\s+\w+\s+(?:that\s+)?/i, '');
    return cleanInput.trim() || null;
  }

  private extractHelpType(input: string): string | null {
    const helpTypes = ['medical', 'ammo', 'support', 'cover', 'rescue'];

    for (const type of helpTypes) {
      if (input.includes(type)) {
        return type;
      }
    }

    return null;
  }

  private calculateContextualRelevance(input: string, context?: string): number {
    if (!context) return 0.5;

    let relevanceScore = 0;
    const contextWords = input.toLowerCase().split(' ');

    this.contextKeywords.forEach((keywords, contextCategory) => {
      if (context.includes(contextCategory)) {
        const matchingKeywords = keywords.filter(keyword =>
          contextWords.some(word => word.includes(keyword))
        );
        relevanceScore += matchingKeywords.length / keywords.length;
      }
    });

    return Math.min(1, relevanceScore);
  }

  async understandContext(input: string, playerState?: any): Promise<ContextualUnderstanding> {
    const intent = await this.processInput(input);
    const emotionalTone = this.analyzeEmotionalTone(input);
    const urgency = this.calculateUrgency(input, intent);
    const complexity = this.calculateComplexity(input);
    const contextualRelevance = this.calculateContextualRelevance(input, this.conversationState.context);
    const suggestedActions = this.generateSuggestedActions(intent, emotionalTone, urgency);

    return {
      playerIntent: intent.name,
      emotionalTone,
      urgency,
      complexity,
      contextualRelevance,
      suggestedActions
    };
  }

  private analyzeEmotionalTone(input: string): 'neutral' | 'urgent' | 'frustrated' | 'excited' | 'confused' {
    const urgentWords = ['quick', 'fast', 'hurry', 'urgent', 'immediate', 'now', 'asap'];
    const frustratedWords = ['damn', 'hell', 'stupid', 'annoying', 'frustrating', 'useless'];
    const excitedWords = ['awesome', 'great', 'amazing', 'excellent', 'wow', 'cool'];
    const confusedWords = ['what', 'how', 'why', 'confused', 'lost', 'dont understand'];

    const words = input.toLowerCase().split(' ');

    if (words.some(word => urgentWords.includes(word))) return 'urgent';
    if (words.some(word => frustratedWords.includes(word))) return 'frustrated';
    if (words.some(word => excitedWords.includes(word))) return 'excited';
    if (words.some(word => confusedWords.includes(word))) return 'confused';

    return 'neutral';
  }

  private calculateUrgency(input: string, intent: NLPIntent): number {
    let urgency = 0.3; // Base urgency

    const urgentIndicators = ['now', 'quick', 'fast', 'emergency', 'critical', 'immediate'];
    const words = input.toLowerCase().split(' ');

    for (const indicator of urgentIndicators) {
      if (words.includes(indicator)) {
        urgency += 0.2;
      }
    }

    // Increase urgency for certain intents
    if (['attack', 'defend', 'help'].includes(intent.name)) {
      urgency += 0.3;
    }

    return Math.min(1, urgency);
  }

  private calculateComplexity(input: string): number {
    const wordCount = input.split(' ').length;
    const sentenceCount = input.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(1, sentenceCount);

    // Complexity based on sentence structure and vocabulary
    let complexity = 0.2; // Base complexity

    if (wordCount > 10) complexity += 0.2;
    if (avgWordsPerSentence > 8) complexity += 0.2;
    if (input.includes('because') || input.includes('although') || input.includes('however')) {
      complexity += 0.2;
    }

    return Math.min(1, complexity);
  }

  private generateSuggestedActions(intent: NLPIntent, emotionalTone: string, urgency: number): string[] {
    const actions: string[] = [];

    switch (intent.name) {
      case 'attack':
        actions.push('Engage target', 'Switch to combat mode', 'Alert teammates');
        break;

      case 'defend':
        actions.push('Take cover', 'Alert team of threat', 'Prepare defensive position');
        break;

      case 'move':
        actions.push('Navigate to location', 'Clear path if needed', 'Update team on position');
        break;

      case 'help':
        actions.push('Provide assistance', 'Coordinate support', 'Assess situation');
        break;

      case 'communicate':
        actions.push('Send message', 'Update team status', 'Request information');
        break;

      case 'question':
        actions.push('Provide answer', 'Clarify information', 'Offer guidance');
        break;
    }

    // Adjust suggestions based on emotional tone
    if (emotionalTone === 'urgent') {
      actions.unshift('Prioritize immediate action');
    } else if (emotionalTone === 'frustrated') {
      actions.push('Offer encouragement', 'Simplify current objective');
    }

    return actions;
  }

  updateConversationState(newContext: Partial<ConversationState>): void {
    this.conversationState = { ...this.conversationState, ...newContext };

    // Add to history if there's a new message
    if (newContext.history && newContext.history.length > this.conversationState.history.length) {
      const latestMessage = newContext.history[newContext.history.length - 1];
      this.conversationState.history.push(latestMessage);

      // Keep history manageable
      if (this.conversationState.history.length > 50) {
        this.conversationState.history = this.conversationState.history.slice(-50);
      }
    }
  }

  getConversationState(): ConversationState {
    return { ...this.conversationState };
  }

  async generateResponse(input: string, context?: string): Promise<string> {
    const understanding = await this.understandContext(input);

    // Generate contextual response based on understanding
    switch (understanding.playerIntent) {
      case 'attack':
        return this.generateAttackResponse(understanding);

      case 'defend':
        return this.generateDefendResponse(understanding);

      case 'move':
        return this.generateMoveResponse(understanding);

      case 'help':
        return this.generateHelpResponse(understanding);

      case 'communicate':
        return this.generateCommunicationResponse(understanding);

      case 'question':
        return this.generateQuestionResponse(understanding);

      default:
        return this.generateDefaultResponse(understanding);
    }
  }

  private generateAttackResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "Engaging target now!",
      "Attacking as requested.",
      "Moving to engage the enemy.",
      "Combat mode activated!"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateDefendResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "Taking defensive positions!",
      "Covering the area as requested.",
      "Defensive stance activated.",
      "Protecting our position!"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateMoveResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "Moving to the requested location.",
      "Navigating to the target position.",
      "Changing position as commanded.",
      "On the move!"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateHelpResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "Assistance is on the way!",
      "Moving to provide support.",
      "Help is coming, hold on!",
      "Responding to your call for help."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateCommunicationResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "Message received and processed.",
      "Communication acknowledged.",
      "Information received, thank you.",
      "Got it, processing the information."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateQuestionResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "Let me help you with that question.",
      "I understand you need clarification.",
      "Allow me to provide that information.",
      "Good question, let me assist you."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateDefaultResponse(understanding: ContextualUnderstanding): string {
    const responses = [
      "I understand your request.",
      "Processing your command.",
      "Acknowledged.",
      "Roger that."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  async analyzeSentiment(input: string): Promise<{ sentiment: number; confidence: number }> {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'frustrated'];

    const words = input.toLowerCase().split(' ');
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) {
      return { sentiment: 0.5, confidence: 0.3 };
    }

    const sentiment = (positiveCount - negativeCount) / totalSentimentWords + 0.5;
    const confidence = Math.min(0.9, totalSentimentWords / words.length * 2);

    return { sentiment: Math.max(0, Math.min(1, sentiment)), confidence };
  }

  async extractEntities(input: string): Promise<Array<{ type: string; value: string; confidence: number }>> {
    const entities: Array<{ type: string; value: string; confidence: number }> = [];

    // Extract common gaming entities
    const entityPatterns = {
      weapon: /(pistol|rifle|shotgun|sniper|knife|grenade|rocket|laser)/i,
      location: /(base|camp|tower|bridge|building|room|area|zone)/i,
      enemy: /(soldier|guard|robot|alien|zombie|monster|terrorist)/i,
      action: /(shoot|run|hide|attack|defend|heal|repair|build)/i,
      number: /\d+/g
    };

    for (const [type, pattern] of Object.entries(entityPatterns)) {
      const matches = input.match(pattern);
      if (matches) {
        for (const match of matches) {
          entities.push({
            type,
            value: match.toLowerCase(),
            confidence: 0.8
          });
        }
      }
    }

    return entities;
  }

  async classifyIntent(input: string): Promise<{ intent: string; confidence: number }> {
    const processed = await this.processInput(input);
    return {
      intent: processed.name,
      confidence: processed.confidence
    };
  }

  resetConversation(): void {
    this.conversationState = {
      topic: 'general',
      context: 'gaming',
      history: [],
      playerMood: 'neutral',
      sessionGoals: [],
      unresolvedQueries: []
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}