// @ts-nocheck
import { VoiceAssistantSystem, VoiceAssistantConfig, TacticalAdvice, DialogueContext } from './voice-assistant-system';

export interface VoiceAssistantServiceConfig {
  autoAdvice: boolean;
  adviceInterval: number; // in milliseconds
  voiceActivation: boolean;
  commandFeedback: boolean;
  emotionAwareness: boolean;
  learningEnabled: boolean;
}

export class VoiceAssistantService {
  private voiceAssistant: VoiceAssistantSystem;
  private config: VoiceAssistantServiceConfig;
  private adviceIntervalId: NodeJS.Timeout | null = null;
  private isListening = false;
  private lastAdviceTime = 0;
  private playerEmotionHistory: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
  }> = [];

  constructor(voiceAssistantConfig: VoiceAssistantConfig, serviceConfig: VoiceAssistantServiceConfig) {
    this.voiceAssistant = new VoiceAssistantSystem(voiceAssistantConfig);
    this.config = serviceConfig;
  }

  async initialize(): Promise<void> {
    await this.voiceAssistant.initialize();
    
    if (this.config.autoAdvice) {
      this.startAutoAdvice();
    }
    
    console.log('Voice Assistant Service initialized');
  }

  async processVoiceInput(input: string | ArrayBuffer): Promise<{
    success: boolean;
    response: string;
    commandExecuted: boolean;
    tacticalAdvice?: TacticalAdvice[];
  }> {
    try {
      const command = await this.voiceAssistant.processVoiceCommand(input);
      
      let response = '';
      let tacticalAdvice: TacticalAdvice[] = [];
      
      // Generate appropriate response based on command
      if (command.intent === 'tactical_advice') {
        tacticalAdvice = await this.voiceAssistant.generateTacticalAdvice();
        response = this.formatTacticalAdviceResponse(tacticalAdvice);
      } else {
        response = await this.voiceAssistant.generateDynamicDialogue(command.command);
      }

      // Provide command feedback if enabled
      if (this.config.commandFeedback) {
        console.log(`Command executed: ${command.intent} with confidence ${command.confidence}`);
      }

      return {
        success: true,
        response,
        commandExecuted: command.confidence > 0.7,
        tacticalAdvice: tacticalAdvice.length > 0 ? tacticalAdvice : undefined
      };
    } catch (error) {
      console.error('Error processing voice input:', error);
      return {
        success: false,
        response: this.getErrorMessage(),
        commandExecuted: false
      };
    }
  }

  async processTextInput(text: string): Promise<{
    success: boolean;
    response: string;
    commandExecuted: boolean;
    tacticalAdvice?: TacticalAdvice[];
  }> {
    try {
      const command = await this.voiceAssistant.processTextCommand(text);
      
      let response = '';
      let tacticalAdvice: TacticalAdvice[] = [];
      
      if (command.intent === 'tactical_advice' || text.toLowerCase().includes('advice') || text.toLowerCase().includes('help')) {
        tacticalAdvice = await this.voiceAssistant.generateTacticalAdvice();
        response = this.formatTacticalAdviceResponse(tacticalAdvice);
      } else {
        response = await this.voiceAssistant.generateDynamicDialogue(text);
      }

      return {
        success: true,
        response,
        commandExecuted: command.confidence > 0.7,
        tacticalAdvice: tacticalAdvice.length > 0 ? tacticalAdvice : undefined
      };
    } catch (error) {
      console.error('Error processing text input:', error);
      return {
        success: false,
        response: this.getErrorMessage(),
        commandExecuted: false
      };
    }
  }

  async requestTacticalAdvice(): Promise<TacticalAdvice[]> {
    try {
      return await this.voiceAssistant.generateTacticalAdvice();
    } catch (error) {
      console.error('Error generating tactical advice:', error);
      return [];
    }
  }

  async generateContextualDialogue(context?: string): Promise<string> {
    try {
      return await this.voiceAssistant.generateDynamicDialogue(context);
    } catch (error) {
      console.error('Error generating dialogue:', error);
      return '';
    }
  }

  async analyzePlayerEmotion(): Promise<{
    emotion: string;
    confidence: number;
    suggestions: string[];
  }> {
    if (!this.config.emotionAwareness) {
      return { emotion: 'neutral', confidence: 0.5, suggestions: [] };
    }

    try {
      const emotionAnalysis = await this.voiceAssistant.analyzePlayerEmotion();
      
      // Store in emotion history
      this.playerEmotionHistory.push({
        emotion: emotionAnalysis.emotion,
        confidence: emotionAnalysis.confidence,
        timestamp: Date.now()
      });

      // Keep only recent emotions (last 10)
      if (this.playerEmotionHistory.length > 10) {
        this.playerEmotionHistory = this.playerEmotionHistory.slice(-10);
      }

      return emotionAnalysis;
    } catch (error) {
      console.error('Error analyzing player emotion:', error);
      return { emotion: 'neutral', confidence: 0.5, suggestions: [] };
    }
  }

  updateGameContext(context: DialogueContext): void {
    this.voiceAssistant.updateContext(context);
  }

  startVoiceListening(): void {
    if (!this.config.voiceActivation) return;
    
    this.isListening = true;
    console.log('Voice assistant started listening');
    
    // In a real implementation, this would start capturing audio
  }

  stopVoiceListening(): void {
    this.isListening = false;
    console.log('Voice assistant stopped listening');
  }

  isVoiceActive(): boolean {
    return this.isListening;
  }

  private startAutoAdvice(): void {
    if (this.adviceIntervalId) {
      clearInterval(this.adviceIntervalId);
    }

    this.adviceIntervalId = setInterval(async () => {
      const now = Date.now();
      if (now - this.lastAdviceTime > this.config.adviceInterval) {
        try {
          const advice = await this.voiceAssistant.generateTacticalAdvice();
          if (advice.length > 0) {
            const highPriorityAdvice = advice.filter(a => a.priority === 'high' || a.priority === 'critical');
            if (highPriorityAdvice.length > 0) {
              console.log('Auto tactical advice:', highPriorityAdvice);
              this.lastAdviceTime = now;
            }
          }
        } catch (error) {
          console.error('Error in auto advice generation:', error);
        }
      }
    }, this.config.adviceInterval / 2); // Check twice as often as the interval
  }

  private formatTacticalAdviceResponse(advice: TacticalAdvice[]): string {
    if (advice.length === 0) {
      return 'No tactical advice available at the moment.';
    }

    // Sort by priority
    const sortedAdvice = advice.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    let response = '';
    
    // Group by category
    const groupedAdvice = sortedAdvice.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, TacticalAdvice[]>);

    for (const [category, items] of Object.entries(groupedAdvice)) {
      response += `${this.getCategoryTitle(category)}:\n`;
      items.forEach(item => {
        response += `• ${item.advice}\n`;
      });
      response += '\n';
    }

    return response.trim();
  }

  private getCategoryTitle(category: string): string {
    const titles = {
      combat: 'Combat Tactics',
      movement: 'Movement Strategy',
      strategy: 'Strategic Advice',
      resource: 'Resource Management',
      tactical: 'Tactical Overview'
    };
    return titles[category as keyof typeof titles] || category;
  }

  private getErrorMessage(): string {
    const messages = [
      "I'm sorry, I didn't understand that. Could you please repeat?",
      "I'm having trouble processing that command. Please try again.",
      "I didn't catch that. Could you rephrase?",
      "I'm experiencing some technical difficulties. Please try again later."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getEmotionHistory(): Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
  }> {
    return [...this.playerEmotionHistory];
  }

  updateServiceConfig(newConfig: Partial<VoiceAssistantServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto advice if needed
    if (newConfig.autoAdvice !== undefined) {
      if (newConfig.autoAdvice && !this.adviceIntervalId) {
        this.startAutoAdvice();
      } else if (!newConfig.autoAdvice && this.adviceIntervalId) {
        clearInterval(this.adviceIntervalId);
        this.adviceIntervalId = null;
      }
    }
  }

  getServiceStatus(): {
    isReady: boolean;
    isListening: boolean;
    autoAdvice: boolean;
    emotionAwareness: boolean;
    lastCommandTime: number;
    emotionHistoryLength: number;
  } {
    return {
      isReady: this.voiceAssistant.isSystemReady(),
      isListening: this.isListening,
      autoAdvice: this.config.autoAdvice,
      emotionAwareness: this.config.emotionAwareness,
      lastCommandTime: this.lastAdviceTime,
      emotionHistoryLength: this.playerEmotionHistory.length
    };
  }

  dispose(): void {
    if (this.adviceIntervalId) {
      clearInterval(this.adviceIntervalId);
    }
    this.stopVoiceListening();
  }
}