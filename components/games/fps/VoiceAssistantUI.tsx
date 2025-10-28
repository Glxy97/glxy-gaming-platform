// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  Volume2, 
  VolumeX, 
  Brain,
  Target,
  Shield,
  Zap,
  MessageSquare,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    emotion?: string;
    confidence?: number;
    systemsInvolved?: string[];
    actions?: Array<{ type: string; data: any }>;
  };
}

interface VoiceAssistantStatus {
  isReady: boolean;
  isListening: boolean;
  isProcessing: boolean;
  lastActivity: Date;
  systemsStatus: {
    voiceAssistant: 'operational' | 'degraded' | 'offline';
    nlpProcessor: 'operational' | 'degraded' | 'offline';
    dialogueSystem: 'operational' | 'degraded' | 'offline';
    voiceControl: 'operational' | 'degraded' | 'offline';
  };
  performance: {
    responseTime: number;
    accuracy: number;
    satisfaction: number;
  };
}

interface VoiceAssistantUIProps {
  onVoiceCommand?: (command: string) => Promise<{
    response: string;
    actions?: Array<{ type: string; data: any }>;
    systemsInvolved?: string[];
    confidence?: number;
  }>;
  onTextCommand?: (command: string) => Promise<{
    response: string;
    actions?: Array<{ type: string; data: any }>;
    systemsInvolved?: string[];
    confidence?: number;
  }>;
  onStatusRequest?: () => Promise<VoiceAssistantStatus>;
  onSettingsChange?: (settings: any) => void;
  initialStatus?: VoiceAssistantStatus;
  className?: string;
}

export const VoiceAssistantUI: React.FC<VoiceAssistantUIProps> = ({
  onVoiceCommand,
  onTextCommand,
  onStatusRequest,
  onSettingsChange,
  initialStatus,
  className = ''
}) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your intelligent voice assistant. I can help you with tactical advice, weapon management, and voice-controlled gameplay. How can I assist you today?',
      timestamp: new Date(),
      metadata: {
        emotion: 'neutral',
        confidence: 0.9
      }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<VoiceAssistantStatus>(initialStatus || {
    isReady: false,
    isListening: false,
    isProcessing: false,
    lastActivity: new Date(),
    systemsStatus: {
      voiceAssistant: 'operational',
      nlpProcessor: 'operational',
      dialogueSystem: 'operational',
      voiceControl: 'operational'
    },
    performance: {
      responseTime: 150,
      accuracy: 0.85,
      satisfaction: 0.8
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    voiceActivation: true,
    autoResponse: true,
    tacticalAdvice: true,
    emotionalSupport: true,
    voiceFeedback: true,
    confidenceThreshold: 0.7,
    responseStyle: 'balanced' as 'concise' | 'balanced' | 'detailed'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Status polling
  useEffect(() => {
    const pollStatus = async () => {
      if (onStatusRequest) {
        try {
          const newStatus = await onStatusRequest();
          setStatus(newStatus);
        } catch (error) {
          console.error('Error fetching status:', error);
        }
      }
    };

    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [onStatusRequest]);

  const handleVoiceInput = async () => {
    if (!onVoiceCommand || isProcessing) return;

    setIsListening(true);
    setIsProcessing(true);

    try {
      // Simulate voice input (in real implementation, this would capture audio)
      const simulatedCommand = 'Give me tactical advice';
      
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: simulatedCommand,
        timestamp: new Date(),
        metadata: {
          emotion: 'neutral'
        }
      };

      setMessages(prev => [...prev, userMessage]);

      const result = await onVoiceCommand(simulatedCommand);

      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          emotion: 'neutral',
          confidence: result.confidence,
          systemsInvolved: result.systemsInvolved,
          actions: result.actions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your voice command.',
        timestamp: new Date(),
        metadata: {
          emotion: 'concerned'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTextCommand || !inputText.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: inputText,
        timestamp: new Date(),
        metadata: {
          emotion: 'neutral'
        }
      };

      setMessages(prev => [...prev, userMessage]);
      const commandText = inputText;
      setInputText('');

      const result = await onTextCommand(commandText);

      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          emotion: 'neutral',
          confidence: result.confidence,
          systemsInvolved: result.systemsInvolved,
          actions: result.actions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your command.',
        timestamp: new Date(),
        metadata: {
          emotion: 'concerned'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (systemStatus: 'operational' | 'degraded' | 'offline') => {
    switch (systemStatus) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
    }
  };

  const getStatusIcon = (systemStatus: 'operational' | 'degraded' | 'offline') => {
    switch (systemStatus) {
      case 'operational': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'offline': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold">Intelligent Voice Assistant</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className={`w-2 h-2 rounded-full ${status.isReady ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{status.isReady ? 'Online' : 'Offline'}</span>
                <span>•</span>
                <span>Response: {status.performance.responseTime}ms</span>
                <span>•</span>
                <span>Accuracy: {(status.performance.accuracy * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600'
                        : message.type === 'system'
                        ? 'bg-yellow-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {message.type === 'user' && <MessageSquare className="w-4 h-4" />}
                      {message.type === 'assistant' && <Brain className="w-4 h-4" />}
                      {message.type === 'system' && <AlertCircle className="w-4 h-4" />}
                      <span className="text-xs opacity-75">
                        {message.type === 'user' ? 'You' : 'Assistant'} • {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.metadata && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.metadata.emotion && (
                          <Badge variant="secondary" className="text-xs">
                            {message.metadata.emotion}
                          </Badge>
                        )}
                        {message.metadata.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {(message.metadata.confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                        {message.metadata.systemsInvolved?.map((system) => (
                          <Badge key={system} variant="outline" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleTextSubmit} className="flex space-x-2">
              <Input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your command or question..."
                disabled={isProcessing}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                type="submit"
                disabled={isProcessing || !inputText.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={handleVoiceInput}
                disabled={isProcessing}
                variant={isListening ? "destructive" : "default"}
                size="sm"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Status Panel */}
        <div className="w-80 border-l border-gray-700 p-4 space-y-4">
          {/* System Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(status.systemsStatus).map(([system, systemStatus]) => (
                <div key={system} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 capitalize">
                    {system.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(systemStatus)}
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus)}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  setInputText('Give me tactical advice');
                  inputRef.current?.focus();
                }}
              >
                <Target className="w-3 h-3 mr-2" />
                Tactical Advice
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  setInputText('Check weapon status');
                  inputRef.current?.focus();
                }}
              >
                <Shield className="w-3 h-3 mr-2" />
                Weapon Status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  setInputText('Report my status');
                  inputRef.current?.focus();
                }}
              >
                <Activity className="w-3 h-3 mr-2" />
                Status Report
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          {showSettings && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Voice Activation</span>
                  <Button
                    variant={settings.voiceActivation ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingsChange({ voiceActivation: !settings.voiceActivation })}
                  >
                    {settings.voiceActivation ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Tactical Advice</span>
                  <Button
                    variant={settings.tacticalAdvice ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingsChange({ tacticalAdvice: !settings.tacticalAdvice })}
                  >
                    {settings.tacticalAdvice ? <Target className="w-3 h-3" /> : <Target className="w-3 h-3 opacity-50" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Emotional Support</span>
                  <Button
                    variant={settings.emotionalSupport ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingsChange({ emotionalSupport: !settings.emotionalSupport })}
                  >
                    {settings.emotionalSupport ? <Brain className="w-3 h-3" /> : <Brain className="w-3 h-3 opacity-50" />}
                  </Button>
                </div>
                <Separator />
                <div>
                  <span className="text-xs">Response Style</span>
                  <div className="flex space-x-1 mt-1">
                    {(['concise', 'balanced', 'detailed'] as const).map((style) => (
                      <Button
                        key={style}
                        variant={settings.responseStyle === style ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSettingsChange({ responseStyle: style })}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-xs">Processing...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};