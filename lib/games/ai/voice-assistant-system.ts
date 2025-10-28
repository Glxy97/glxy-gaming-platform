// import ZAI from 'z-ai-web-dev-sdk'; // Temporarily commented out - package not available

export interface VoiceCommand {
  command: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  timestamp: number;
}

export interface TacticalAdvice {
  situation: string;
  advice: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'combat' | 'movement' | 'strategy' | 'resource' | 'tactical';
  confidence: number;
}

export interface DialogueContext {
  gameState: {
    health: number;
    ammo: number;
    enemies: number;
    position: { x: number; y: number; z: number };
    currentWeapon: string;
    score: number;
  };
  playerProfile: {
    skill: number;
    playStyle: 'aggressive' | 'defensive' | 'balanced' | 'tactical';
    preferences: Record<string, any>;
  };
  environment: {
    level: string;
    threats: Array<{
      type: string;
      position: { x: number; y: number; z: number };
      danger: number;
    }>;
    opportunities: Array<{
      type: string;
      position: { x: number; y: number; z: number };
      value: number;
    }>;
  };
}

export interface VoiceAssistantConfig {
  language: 'en' | 'de';
  voiceType: 'male' | 'female' | 'neutral';
  responseStyle: 'concise' | 'detailed' | 'encouraging' | 'professional';
  tacticalDepth: 'basic' | 'advanced' | 'expert';
  enabledFeatures: {
    tacticalAdvice: boolean;
    commandExecution: boolean;
    dialogueGeneration: boolean;
    emotionalSupport: boolean;
    learningAdaptation: boolean;
  };
}

export class VoiceAssistantSystem {
  private zai: any | null = null;
  private config: VoiceAssistantConfig;
  private context: DialogueContext | null = null;
  private commandHistory: VoiceCommand[] = [];
  private dialogueHistory: Array<{ role: string; content: string; timestamp: number }> = [];
  private isInitialized = false;

  constructor(config: VoiceAssistantConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // this.zai = await ZAI.create();
      this.isInitialized = true;
      console.log('Voice Assistant System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Voice Assistant System:', error);
      throw error;
    }
  }

  updateContext(context: DialogueContext): void {
    this.context = context;
  }

  async processVoiceCommand(audioInput: string | ArrayBuffer): Promise<VoiceCommand> {
    if (!this.isInitialized || !this.zai) {
      throw new Error('Voice Assistant System not initialized');
    }

    try {
      // Convert audio to text using ZAI
      const transcription = await this.transcribeAudio(audioInput);
      
      // Process the transcribed text to extract intent and entities
      const command = await this.analyzeIntent(transcription);
      
      // Store in command history
      this.commandHistory.push(command);
      
      // Execute the command if enabled
      if (this.config.enabledFeatures.commandExecution) {
        await this.executeCommand(command);
      }

      return command;
    } catch (error) {
      console.error('Error processing voice command:', error);
      throw error;
    }
  }

  async processTextCommand(text: string): Promise<VoiceCommand> {
    if (!this.isInitialized || !this.zai) {
      throw new Error('Voice Assistant System not initialized');
    }

    try {
      const command = await this.analyzeIntent(text);
      this.commandHistory.push(command);

      if (this.config.enabledFeatures.commandExecution) {
        await this.executeCommand(command);
      }

      return command;
    } catch (error) {
      console.error('Error processing text command:', error);
      throw error;
    }
  }

  async generateTacticalAdvice(): Promise<TacticalAdvice[]> {
    if (!this.isInitialized || !this.zai || !this.context) {
      return [];
    }

    try {
      const prompt = this.buildTacticalAdvicePrompt();
      
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert tactical AI assistant for a first-person shooter game. 
            Analyze the current game situation and provide tactical advice. 
            Consider the player's health, ammo, enemy positions, and overall tactical situation.
            Respond in JSON format with advice array containing situation, advice, priority, category, and confidence.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return [];

      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Fallback: extract advice from text response
        return [{
          situation: 'General tactical situation',
          advice: response,
          priority: 'medium',
          category: 'tactical',
          confidence: 0.8
        }];
      }
    } catch (error) {
      console.error('Error generating tactical advice:', error);
      return [];
    }
  }

  async generateDynamicDialogue(playerMessage?: string): Promise<string> {
    if (!this.isInitialized || !this.zai || !this.context) {
      return '';
    }

    try {
      const prompt = this.buildDialoguePrompt(playerMessage);
      
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant in a first-person shooter game. 
            ${this.getResponseStylePrompt()}
            Respond naturally and helpfully, considering the current game situation and player state.
            ${this.config.language === 'de' ? 'Respond in German.' : 'Respond in English.'}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Store in dialogue history
      this.dialogueHistory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('Error generating dialogue:', error);
      return '';
    }
  }

  async analyzePlayerEmotion(): Promise<{
    emotion: 'calm' | 'stressed' | 'excited' | 'frustrated' | 'focused';
    confidence: number;
    suggestions: string[];
  }> {
    if (!this.isInitialized || !this.zai || !this.context) {
      return { emotion: 'calm', confidence: 0.5, suggestions: [] };
    }

    try {
      const prompt = `
        Analyze the player's current emotional state based on:
        - Health: ${this.context.gameState.health}%
        - Ammo: ${this.context.gameState.ammo}
        - Enemies nearby: ${this.context.environment.threats.length}
        - Recent performance: ${this.context.gameState.score}
        - Play style: ${this.context.playerProfile.playStyle}
        
        Respond with JSON containing emotion (calm, stressed, excited, frustrated, focused), confidence (0-1), and suggestions array.
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing player emotions in gaming contexts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return { emotion: 'calm', confidence: 0.5, suggestions: [] };
      }

      try {
        return JSON.parse(response);
      } catch {
        return { emotion: 'calm', confidence: 0.5, suggestions: [] };
      }
    } catch (error) {
      console.error('Error analyzing player emotion:', error);
      return { emotion: 'calm', confidence: 0.5, suggestions: [] };
    }
  }

  private async transcribeAudio(audioInput: string | ArrayBuffer): Promise<string> {
    // In a real implementation, this would use speech-to-text
    // For now, we'll return the input as-is if it's a string
    if (typeof audioInput === 'string') {
      return audioInput;
    }
    
    // Placeholder for actual audio transcription
    return 'transcribed audio placeholder';
  }

  private async analyzeIntent(text: string): Promise<VoiceCommand> {
    const prompt = `
      Analyze the following voice command and extract intent and entities:
      Command: "${text}"
      
      Respond with JSON containing:
      - command: original command
      - intent: main intent (e.g., 'move', 'shoot', 'reload', 'switch_weapon', 'tactical_advice', 'status_check')
      - entities: extracted parameters
      - confidence: confidence score (0-1)
      - timestamp: current timestamp
    `;

    try {
      const completion = await this.zai!.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing voice commands in gaming contexts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from intent analysis');
      }

      const parsed = JSON.parse(response);
      return {
        ...parsed,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error analyzing intent:', error);
      return {
        command: text,
        intent: 'unknown',
        entities: {},
        confidence: 0.1,
        timestamp: Date.now()
      };
    }
  }

  private async executeCommand(command: VoiceCommand): Promise<void> {
    // This would integrate with the game engine to execute commands
    console.log('Executing command:', command);
    
    // Placeholder for actual command execution
    // This would trigger game actions based on the parsed intent
  }

  private buildTacticalAdvicePrompt(): string {
    if (!this.context) return '';

    return `
      Current game situation:
      - Player health: ${this.context.gameState.health}%
      - Player ammo: ${this.context.gameState.ammo}
      - Enemies nearby: ${this.context.environment.threats.length}
      - Current weapon: ${this.context.gameState.currentWeapon}
      - Player position: (${this.context.gameState.position.x}, ${this.context.gameState.position.y}, ${this.context.gameState.position.z})
      - Player skill level: ${this.context.playerProfile.skill}
      - Player play style: ${this.context.playerProfile.playStyle}
      
      Threats:
      ${this.context.environment.threats.map(t => `- ${t.type} at (${t.position.x}, ${t.position.y}, ${t.position.z}) with danger level ${t.danger}`).join('\n')}
      
      Opportunities:
      ${this.context.environment.opportunities.map(o => `- ${o.type} at (${o.position.x}, ${o.position.y}, ${o.position.z}) with value ${o.value}`).join('\n')}
      
      Provide tactical advice based on this situation.
    `;
  }

  private buildDialoguePrompt(playerMessage?: string): string {
    if (!this.context) return '';

    let prompt = `Current game context:
    - Health: ${this.context.gameState.health}%
    - Ammo: ${this.context.gameState.ammo}
    - Score: ${this.context.gameState.score}
    - Enemies nearby: ${this.context.environment.threats.length}
    `;

    if (playerMessage) {
      prompt += `\nPlayer says: "${playerMessage}"`;
    }

    return prompt;
  }

  private getResponseStylePrompt(): string {
    switch (this.config.responseStyle) {
      case 'concise':
        return 'Keep responses brief and to the point.';
      case 'detailed':
        return 'Provide comprehensive and detailed responses.';
      case 'encouraging':
        return 'Be supportive and encouraging in your responses.';
      case 'professional':
        return 'Maintain a professional and tactical tone.';
      default:
        return '';
    }
  }

  getCommandHistory(): VoiceCommand[] {
    return [...this.commandHistory];
  }

  getDialogueHistory(): Array<{ role: string; content: string; timestamp: number }> {
    return [...this.dialogueHistory];
  }

  updateConfig(newConfig: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isSystemReady(): boolean {
    return this.isInitialized && this.zai !== null;
  }
}