import { VoiceCommand } from './voice-assistant-system';

export interface VoiceAction {
  id: string;
  name: string;
  description: string;
  category: 'movement' | 'combat' | 'weapon' | 'tactical' | 'utility' | 'system';
  voiceTriggers: string[];
  parameters: Record<string, any>;
  executionTime: number; // in milliseconds
  cooldown: number; // in milliseconds
  lastExecuted: number;
  enabled: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  executionTime: number;
  error?: string;
}

export interface VoiceControlConfig {
  enabled: boolean;
  activationPhrase: string;
  deactivationPhrase: string;
  confirmationRequired: boolean;
  autoExecute: boolean;
  feedbackLevel: 'minimal' | 'normal' | 'detailed';
  voiceActivation: boolean;
  gestureActivation: boolean;
}

export class VoiceControlledGameplay {
  private voiceActions: Map<string, VoiceAction>;
  private config: VoiceControlConfig;
  private isActive = false;
  private actionHistory: Array<{
    action: string;
    timestamp: number;
    success: boolean;
    parameters: any;
  }>;
  private cooldownTimers: Map<string, NodeJS.Timeout>;
  private gameEngine: any; // Reference to game engine

  constructor(config: VoiceControlConfig, gameEngine?: any) {
    this.config = config;
    this.gameEngine = gameEngine;
    this.voiceActions = new Map();
    this.actionHistory = [];
    this.cooldownTimers = new Map();
    this.initializeVoiceActions();
  }

  async processVoiceCommand(command: VoiceCommand): Promise<ActionResult> {
    if (!this.config.enabled || !this.isActive) {
      return {
        success: false,
        message: 'Voice control is not active',
        executionTime: 0
      };
    }

    try {
      // Check for activation/deactivation phrases
      if (this.isActivationPhrase(command.command)) {
        return this.activateVoiceControl();
      }

      if (this.isDeactivationPhrase(command.command)) {
        return this.deactivateVoiceControl();
      }

      // Find matching action
      const action = this.findMatchingAction(command);
      if (!action) {
        return {
          success: false,
          message: 'No matching action found for command',
          executionTime: 0
        };
      }

      // Check cooldown
      if (this.isOnCooldown(action.id)) {
        return {
          success: false,
          message: `Action "${action.name}" is on cooldown`,
          executionTime: 0
        };
      }

      // Execute action
      const result = await this.executeAction(action, command);
      
      // Record in history
      this.actionHistory.push({
        action: action.id,
        timestamp: Date.now(),
        success: result.success,
        parameters: command.entities
      });

      // Set cooldown
      this.setCooldown(action.id, action.cooldown);

      return result;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        success: false,
        message: 'Error processing voice command',
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeActionById(actionId: string, parameters: Record<string, any> = {}): Promise<ActionResult> {
    const action = this.voiceActions.get(actionId);
    if (!action) {
      return {
        success: false,
        message: `Action "${actionId}" not found`,
        executionTime: 0
      };
    }

    return this.executeAction(action, { entities: parameters } as any);
  }

  private async executeAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      let result: ActionResult;

      switch (action.category) {
        case 'movement':
          result = await this.executeMovementAction(action, command);
          break;
        case 'combat':
          result = await this.executeCombatAction(action, command);
          break;
        case 'weapon':
          result = await this.executeWeaponAction(action, command);
          break;
        case 'tactical':
          result = await this.executeTacticalAction(action, command);
          break;
        case 'utility':
          result = await this.executeUtilityAction(action, command);
          break;
        case 'system':
          result = await this.executeSystemAction(action, command);
          break;
        default:
          result = {
            success: false,
            message: `Unknown action category: ${action.category}`,
            executionTime: 0
          };
      }

      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      // Provide feedback
      if (this.config.feedbackLevel !== 'minimal') {
        this.provideActionFeedback(action, result);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        message: `Error executing action "${action.name}"`,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeMovementAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    const direction = command.entities.direction || command.entities.target;
    const distance = command.entities.distance || 10;

    switch (action.id) {
      case 'move_forward':
        return this.movePlayer('forward', distance);
      case 'move_backward':
        return this.movePlayer('backward', distance);
      case 'move_left':
        return this.movePlayer('left', distance);
      case 'move_right':
        return this.movePlayer('right', distance);
      case 'move_to_position':
        return this.moveToPosition(command.entities.position);
      case 'take_cover':
        return this.takeCover();
      case 'sprint':
        return this.setSprint(true);
      case 'stop_sprint':
        return this.setSprint(false);
      case 'crouch':
        return this.setCrouch(true);
      case 'stand_up':
        return this.setCrouch(false);
      default:
        return {
          success: false,
          message: `Unknown movement action: ${action.id}`,
          executionTime: 0
        };
    }
  }

  private async executeCombatAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    switch (action.id) {
      case 'attack_target':
        return this.attackTarget(command.entities.target);
      case 'fire_weapon':
        return this.fireWeapon();
      case 'aim_down_sights':
        return this.setAiming(true);
      case 'stop_aiming':
        return this.setAiming(false);
      case 'throw_grenade':
        return this.throwGrenade(command.entities.type || 'frag');
      case 'use_melee':
        return this.useMeleeAttack();
      default:
        return {
          success: false,
          message: `Unknown combat action: ${action.id}`,
          executionTime: 0
        };
    }
  }

  private async executeWeaponAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    const weaponName = command.entities.weapon || command.entities.gun;

    switch (action.id) {
      case 'switch_weapon':
        return this.switchWeapon(weaponName);
      case 'reload_weapon':
        return this.reloadWeapon();
      case 'switch_fire_mode':
        return this.switchFireMode(command.entities.mode);
      case 'inspect_weapon':
        return this.inspectWeapon();
      default:
        return {
          success: false,
          message: `Unknown weapon action: ${action.id}`,
          executionTime: 0
        };
    }
  }

  private async executeTacticalAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    switch (action.id) {
      case 'request_tactical_advice':
        return this.requestTacticalAdvice();
      case 'mark_target':
        return this.markTarget(command.entities.target);
      case 'set_waypoint':
        return this.setWaypoint(command.entities.position);
      case 'call_for_backup':
        return this.callForBackup();
      case 'report_status':
        return this.reportStatus();
      default:
        return {
          success: false,
          message: `Unknown tactical action: ${action.id}`,
          executionTime: 0
        };
    }
  }

  private async executeUtilityAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    switch (action.id) {
      case 'use_medkit':
        return this.useMedkit();
      case 'use_ammo':
        return this.useAmmo();
      case 'interact_object':
        return this.interactWithObject(command.entities.object);
      case 'open_door':
        return this.openDoor(command.entities.door);
      case 'hack_terminal':
        return this.hackTerminal(command.entities.terminal);
      default:
        return {
          success: false,
          message: `Unknown utility action: ${action.id}`,
          executionTime: 0
        };
    }
  }

  private async executeSystemAction(action: VoiceAction, command: VoiceCommand): Promise<ActionResult> {
    switch (action.id) {
      case 'toggle_voice_control':
        return this.toggleVoiceControl();
      case 'pause_game':
        return this.pauseGame();
      case 'resume_game':
        return this.resumeGame();
      case 'save_game':
        return this.saveGame(command.entities.slot);
      case 'load_game':
        return this.loadGame(command.entities.slot);
      case 'exit_game':
        return this.exitGame();
      case 'toggle_hud':
        return this.toggleHUD();
      case 'screenshot':
        return this.takeScreenshot();
      default:
        return {
          success: false,
          message: `Unknown system action: ${action.id}`,
          executionTime: 0
        };
    }
  }

  // Game engine integration methods (placeholders)
  private async movePlayer(direction: string, distance: number): Promise<ActionResult> {
    // Placeholder for actual game engine integration
    console.log(`Moving player ${direction} for ${distance} units`);
    return {
      success: true,
      message: `Moving ${direction}`,
      executionTime: 100,
      data: { direction, distance }
    };
  }

  private async moveToPosition(position: any): Promise<ActionResult> {
    console.log('Moving to position:', position);
    return {
      success: true,
      message: 'Moving to specified position',
      executionTime: 150,
      data: { position }
    };
  }

  private async takeCover(): Promise<ActionResult> {
    console.log('Taking cover');
    return {
      success: true,
      message: 'Taking cover',
      executionTime: 200,
      data: { action: 'cover' }
    };
  }

  private async setSprint(sprinting: boolean): Promise<ActionResult> {
    console.log(`Sprinting: ${sprinting}`);
    return {
      success: true,
      message: sprinting ? 'Sprinting' : 'Stopped sprinting',
      executionTime: 50,
      data: { sprinting }
    };
  }

  private async setCrouch(crouching: boolean): Promise<ActionResult> {
    console.log(`Crouching: ${crouching}`);
    return {
      success: true,
      message: crouching ? 'Crouching' : 'Standing up',
      executionTime: 100,
      data: { crouching }
    };
  }

  private async attackTarget(target: any): Promise<ActionResult> {
    console.log('Attacking target:', target);
    return {
      success: true,
      message: 'Attacking target',
      executionTime: 300,
      data: { target }
    };
  }

  private async fireWeapon(): Promise<ActionResult> {
    console.log('Firing weapon');
    return {
      success: true,
      message: 'Weapon fired',
      executionTime: 150,
      data: { action: 'fire' }
    };
  }

  private async setAiming(aiming: boolean): Promise<ActionResult> {
    console.log(`Aiming: ${aiming}`);
    return {
      success: true,
      message: aiming ? 'Aiming down sights' : 'Stopped aiming',
      executionTime: 100,
      data: { aiming }
    };
  }

  private async switchWeapon(weaponName: string): Promise<ActionResult> {
    console.log('Switching to weapon:', weaponName);
    return {
      success: true,
      message: `Switched to ${weaponName}`,
      executionTime: 500,
      data: { weapon: weaponName }
    };
  }

  private async reloadWeapon(): Promise<ActionResult> {
    console.log('Reloading weapon');
    return {
      success: true,
      message: 'Reloading weapon',
      executionTime: 2000,
      data: { action: 'reload' }
    };
  }

  private async useMedkit(): Promise<ActionResult> {
    console.log('Using medkit');
    return {
      success: true,
      message: 'Using medkit',
      executionTime: 1000,
      data: { action: 'heal' }
    };
  }

  private async requestTacticalAdvice(): Promise<ActionResult> {
    console.log('Requesting tactical advice');
    return {
      success: true,
      message: 'Tactical advice requested',
      executionTime: 100,
      data: { action: 'tactical_advice' }
    };
  }

  private async pauseGame(): Promise<ActionResult> {
    console.log('Pausing game');
    return {
      success: true,
      message: 'Game paused',
      executionTime: 50,
      data: { action: 'pause' }
    };
  }

  private async resumeGame(): Promise<ActionResult> {
    console.log('Resuming game');
    return {
      success: true,
      message: 'Game resumed',
      executionTime: 50,
      data: { action: 'resume' }
    };
  }

  // Additional placeholder methods for completeness
  private async throwGrenade(type: string): Promise<ActionResult> {
    return { success: true, message: `Throwing ${type} grenade`, executionTime: 500, data: { type } };
  }

  private async useMeleeAttack(): Promise<ActionResult> {
    return { success: true, message: 'Melee attack', executionTime: 300, data: { action: 'melee' } };
  }

  private async switchFireMode(mode: string): Promise<ActionResult> {
    return { success: true, message: `Switched to ${mode} fire mode`, executionTime: 200, data: { mode } };
  }

  private async inspectWeapon(): Promise<ActionResult> {
    return { success: true, message: 'Inspecting weapon', executionTime: 1000, data: { action: 'inspect' } };
  }

  private async markTarget(target: any): Promise<ActionResult> {
    return { success: true, message: 'Target marked', executionTime: 100, data: { target } };
  }

  private async setWaypoint(position: any): Promise<ActionResult> {
    return { success: true, message: 'Waypoint set', executionTime: 100, data: { position } };
  }

  private async callForBackup(): Promise<ActionResult> {
    return { success: true, message: 'Backup called', executionTime: 100, data: { action: 'backup' } };
  }

  private async reportStatus(): Promise<ActionResult> {
    return { success: true, message: 'Status reported', executionTime: 100, data: { action: 'status' } };
  }

  private async useAmmo(): Promise<ActionResult> {
    return { success: true, message: 'Ammo used', executionTime: 500, data: { action: 'ammo' } };
  }

  private async interactWithObject(object: string): Promise<ActionResult> {
    return { success: true, message: `Interacting with ${object}`, executionTime: 500, data: { object } };
  }

  private async openDoor(door: string): Promise<ActionResult> {
    return { success: true, message: `Opening ${door}`, executionTime: 1000, data: { door } };
  }

  private async hackTerminal(terminal: string): Promise<ActionResult> {
    return { success: true, message: `Hacking ${terminal}`, executionTime: 3000, data: { terminal } };
  }

  private async toggleVoiceControl(): Promise<ActionResult> {
    this.isActive = !this.isActive;
    return { success: true, message: `Voice control ${this.isActive ? 'activated' : 'deactivated'}`, executionTime: 100, data: { active: this.isActive } };
  }

  private async saveGame(slot: string): Promise<ActionResult> {
    return { success: true, message: `Game saved to slot ${slot}`, executionTime: 1000, data: { slot } };
  }

  private async loadGame(slot: string): Promise<ActionResult> {
    return { success: true, message: `Game loaded from slot ${slot}`, executionTime: 2000, data: { slot } };
  }

  private async exitGame(): Promise<ActionResult> {
    return { success: true, message: 'Exiting game', executionTime: 100, data: { action: 'exit' } };
  }

  private async toggleHUD(): Promise<ActionResult> {
    return { success: true, message: 'HUD toggled', executionTime: 50, data: { action: 'toggle_hud' } };
  }

  private async takeScreenshot(): Promise<ActionResult> {
    return { success: true, message: 'Screenshot taken', executionTime: 100, data: { action: 'screenshot' } };
  }

  private findMatchingAction(command: VoiceCommand): VoiceAction | null {
    const normalizedCommand = command.command.toLowerCase();
    
    for (const action of this.voiceActions.values()) {
      if (!action.enabled) continue;
      
      for (const trigger of action.voiceTriggers) {
        if (normalizedCommand.includes(trigger.toLowerCase())) {
          return action;
        }
      }
    }
    
    return null;
  }

  private isActivationPhrase(command: string): boolean {
    return command.toLowerCase().includes(this.config.activationPhrase.toLowerCase());
  }

  private isDeactivationPhrase(command: string): boolean {
    return command.toLowerCase().includes(this.config.deactivationPhrase.toLowerCase());
  }

  private activateVoiceControl(): ActionResult {
    this.isActive = true;
    return {
      success: true,
      message: 'Voice control activated',
      executionTime: 100,
      data: { active: true }
    };
  }

  private deactivateVoiceControl(): ActionResult {
    this.isActive = false;
    return {
      success: true,
      message: 'Voice control deactivated',
      executionTime: 100,
      data: { active: false }
    };
  }

  private isOnCooldown(actionId: string): boolean {
    const action = this.voiceActions.get(actionId);
    if (!action || action.cooldown === 0) return false;
    
    const timeSinceLastExecution = Date.now() - action.lastExecuted;
    return timeSinceLastExecution < action.cooldown;
  }

  private setCooldown(actionId: string, cooldown: number): void {
    const action = this.voiceActions.get(actionId);
    if (action) {
      action.lastExecuted = Date.now();
    }
    
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        this.cooldownTimers.delete(actionId);
      }, cooldown);
      this.cooldownTimers.set(actionId, timer);
    }
  }

  private provideActionFeedback(action: VoiceAction, result: ActionResult): void {
    const feedback = result.success 
      ? `✓ ${action.name} executed successfully`
      : `✗ ${action.name} failed: ${result.message}`;
    
    console.log('Voice Control Feedback:', feedback);
    
    // In a real implementation, this would trigger visual/audio feedback
  }

  private initializeVoiceActions(): void {
    const actions: VoiceAction[] = [
      // Movement Actions
      {
        id: 'move_forward',
        name: 'Move Forward',
        description: 'Move the player character forward',
        category: 'movement',
        voiceTriggers: ['move forward', 'go forward', 'forward', 'advance'],
        parameters: { distance: 10 },
        executionTime: 100,
        cooldown: 0,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'move_backward',
        name: 'Move Backward',
        description: 'Move the player character backward',
        category: 'movement',
        voiceTriggers: ['move backward', 'go back', 'backward', 'retreat'],
        parameters: { distance: 10 },
        executionTime: 100,
        cooldown: 0,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'move_left',
        name: 'Move Left',
        description: 'Move the player character left',
        category: 'movement',
        voiceTriggers: ['move left', 'go left', 'left', 'strafe left'],
        parameters: { distance: 10 },
        executionTime: 100,
        cooldown: 0,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'move_right',
        name: 'Move Right',
        description: 'Move the player character right',
        category: 'movement',
        voiceTriggers: ['move right', 'go right', 'right', 'strafe right'],
        parameters: { distance: 10 },
        executionTime: 100,
        cooldown: 0,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'take_cover',
        name: 'Take Cover',
        description: 'Take cover behind nearby objects',
        category: 'movement',
        voiceTriggers: ['take cover', 'get cover', 'hide', 'cover me'],
        parameters: {},
        executionTime: 200,
        cooldown: 1000,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'sprint',
        name: 'Sprint',
        description: 'Start sprinting',
        category: 'movement',
        voiceTriggers: ['sprint', 'run', 'faster', 'run faster'],
        parameters: {},
        executionTime: 50,
        cooldown: 0,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'crouch',
        name: 'Crouch',
        description: 'Crouch down',
        category: 'movement',
        voiceTriggers: ['crouch', 'duck', 'get down', 'kneel'],
        parameters: {},
        executionTime: 100,
        cooldown: 500,
        lastExecuted: 0,
        enabled: true
      },
      
      // Combat Actions
      {
        id: 'fire_weapon',
        name: 'Fire Weapon',
        description: 'Fire the current weapon',
        category: 'combat',
        voiceTriggers: ['fire', 'shoot', 'attack', 'open fire'],
        parameters: {},
        executionTime: 150,
        cooldown: 100,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'aim_down_sights',
        name: 'Aim Down Sights',
        description: 'Aim down the weapon sights',
        category: 'combat',
        voiceTriggers: ['aim', 'aim down sights', 'ads', 'sights'],
        parameters: {},
        executionTime: 100,
        cooldown: 200,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'reload_weapon',
        name: 'Reload Weapon',
        description: 'Reload the current weapon',
        category: 'weapon',
        voiceTriggers: ['reload', 'reload weapon', 'reload gun', 'new magazine'],
        parameters: {},
        executionTime: 2000,
        cooldown: 1000,
        lastExecuted: 0,
        enabled: true
      },
      
      // Tactical Actions
      {
        id: 'request_tactical_advice',
        name: 'Request Tactical Advice',
        description: 'Ask for tactical advice',
        category: 'tactical',
        voiceTriggers: ['advice', 'help', 'tactical advice', 'what should i do'],
        parameters: {},
        executionTime: 100,
        cooldown: 5000,
        lastExecuted: 0,
        enabled: true
      },
      
      // System Actions
      {
        id: 'pause_game',
        name: 'Pause Game',
        description: 'Pause the game',
        category: 'system',
        voiceTriggers: ['pause', 'pause game', 'break', 'stop'],
        parameters: {},
        executionTime: 50,
        cooldown: 1000,
        lastExecuted: 0,
        enabled: true
      },
      {
        id: 'resume_game',
        name: 'Resume Game',
        description: 'Resume the game',
        category: 'system',
        voiceTriggers: ['resume', 'resume game', 'continue', 'play'],
        parameters: {},
        executionTime: 50,
        cooldown: 1000,
        lastExecuted: 0,
        enabled: true
      }
    ];

    actions.forEach(action => {
      this.voiceActions.set(action.id, action);
    });
  }

  getAvailableActions(): VoiceAction[] {
    return Array.from(this.voiceActions.values()).filter(action => action.enabled);
  }

  getActionHistory(): Array<{
    action: string;
    timestamp: number;
    success: boolean;
    parameters: any;
  }> {
    return [...this.actionHistory];
  }

  updateConfig(newConfig: Partial<VoiceControlConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  setGameEngine(engine: any): void {
    this.gameEngine = engine;
  }

  isVoiceControlActive(): boolean {
    return this.isActive;
  }

  dispose(): void {
    // Clear all cooldown timers
    this.cooldownTimers.forEach(timer => clearTimeout(timer));
    this.cooldownTimers.clear();
  }
}