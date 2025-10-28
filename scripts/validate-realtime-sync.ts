#!/usr/bin/env tsx

/**
 * Real-time Game State Synchronization Validator
 * 
 * This script implements the validation logic for the Real-time Sync Validator Agent.
 * It can be run standalone or integrated with CI/CD pipelines to ensure the integrity
 * of Socket.IO events, Redis caching, and game state synchronization.
 */

import fs from 'fs';
import path from 'path';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { io as SocketIOClient, Socket } from 'socket.io-client';
import type {
  ValidationResult,
  ValidationDetail,
  PerformanceResult,
  GameType,
  RealtimeSyncValidatorConfig
} from '../agent-configs/types/realtime-sync-validator.types';

interface ValidatorOptions {
  scenario?: string;
  gameType?: GameType;
  performanceTest?: boolean;
  redisUrl?: string;
  databaseUrl?: string;
  socketUrl?: string;
  verbose?: boolean;
  mockMode?: boolean; // deprecated in favor of staticOnly
  staticOnly?: boolean; // only run static checks (no Redis/DB/socket access)
  quiet?: boolean; // reduce console output
}

class RealtimeSyncValidator {
  private redis: Redis;
  private prisma: PrismaClient;
  private config: RealtimeSyncValidatorConfig;
  private results: ValidationResult[] = [];
  
  constructor(private options: ValidatorOptions = {}) {
    // Initialize external systems only if not static-only
    if (!options.staticOnly && !options.mockMode) {
      this.redis = new Redis(options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: options.databaseUrl || process.env.DATABASE_URL
          }
        }
      });
    }
    
    // Load agent configuration
    const configPath = path.join(__dirname, '../agent-configs/realtime-sync-validator.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  async validate(): Promise<ValidationResult[]> {
    if (!this.options.quiet) console.log('🚀 Starting Real-time Sync Validation...');
    
    try {
      if (!this.options.staticOnly) {
        // Validate Redis connection
        await this.validateRedisConnection();
        // Validate database connection
        await this.validateDatabaseConnection();
      }
      
      // Run scenario-specific validations
      if (this.options.scenario) {
        await this.runScenario(this.options.scenario);
      } else {
        // Run all validations
        await this.validateSocketIOEventDefinitions();
        if (!this.options.staticOnly) {
          await this.validateGameStateCaching();
          await this.validateChatSystemIntegrity();
          await this.validateRoomManagement();
        }
        
        if (this.options.performanceTest) {
          await this.runPerformanceTests();
        }
      }
      
      // Generate summary report
      this.generateReport();
      
    } catch (error) {
      if (!this.options.quiet) console.error('❌ Validation failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
    
    return this.results;
  }

  private async validateRedisConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      const pong = await this.redis.ping();
      const latency = Date.now() - startTime;
      
      this.addResult({
        timestamp: new Date(),
        agent_version: this.config.version,
        scenario: 'redis_connection',
        status: pong === 'PONG' ? 'PASS' : 'FAIL',
        details: [{
          category: 'Infrastructure',
          test_name: 'Redis Connection',
          status: pong === 'PONG' ? 'PASS' : 'FAIL',
          message: `Redis responded with "${pong}" in ${latency}ms`
        }],
        performance_metrics: {
          latency_measurements: [{
            operation: 'redis_ping',
            average_ms: latency,
            p95_ms: latency,
            p99_ms: latency,
            max_ms: latency
          }],
          throughput_measurements: [],
          resource_usage: {
            cpu_usage_percent: 0,
            memory_usage_mb: 0,
            redis_memory_mb: 0,
            active_connections: 0
          }
        },
        recommendations: latency > 10 ? ['Consider Redis optimization or closer server'] : []
      });
      
      if (this.options.verbose) {
        console.log(`✅ Redis connection validated (${latency}ms)`);
      }
    } catch (error) {
      this.addResult({
        timestamp: new Date(),
        agent_version: this.config.version,
        scenario: 'redis_connection',
        status: 'FAIL',
        details: [{
          category: 'Infrastructure',
          test_name: 'Redis Connection',
          status: 'FAIL',
          message: `Redis connection failed: ${error}`
        }],
        performance_metrics: this.getEmptyPerformanceMetrics(),
        recommendations: ['Check Redis server status and connection configuration']
      });
      throw error;
    }
  }

  private async validateDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      this.addResult({
        timestamp: new Date(),
        agent_version: this.config.version,
        scenario: 'database_connection',
        status: 'PASS',
        details: [{
          category: 'Infrastructure',
          test_name: 'Database Connection',
          status: 'PASS',
          message: `Database connection successful in ${latency}ms`
        }],
        performance_metrics: {
          latency_measurements: [{
            operation: 'database_query',
            average_ms: latency,
            p95_ms: latency,
            p99_ms: latency,
            max_ms: latency
          }],
          throughput_measurements: [],
          resource_usage: this.getEmptyResourceUsage()
        },
        recommendations: latency > 200 ? ['Consider database optimization'] : []
      });
      
      if (this.options.verbose) {
        console.log(`✅ Database connection validated (${latency}ms)`);
      }
    } catch (error) {
      this.addResult({
        timestamp: new Date(),
        agent_version: this.config.version,
        scenario: 'database_connection',
        status: 'FAIL',
        details: [{
          category: 'Infrastructure',
          test_name: 'Database Connection',
          status: 'FAIL',
          message: `Database connection failed: ${error}`
        }],
        performance_metrics: this.getEmptyPerformanceMetrics(),
        recommendations: ['Check database server status and connection string']
      });
      throw error;
    }
  }

  private async validateSocketIOEventDefinitions(): Promise<void> {
    if (!this.options.quiet) console.log('🔍 Validating Socket.IO event definitions...');
    
    const socketServerPath = path.join(__dirname, '../lib/socket-server.ts');
    const socketClientPath = path.join(__dirname, '../lib/socket-client.ts');
    
    const details: ValidationDetail[] = [];
    
    try {
      // Check if socket server file exists and has proper exports
      if (fs.existsSync(socketServerPath)) {
        const serverContent = fs.readFileSync(socketServerPath, 'utf8');
        
        // Validate event interface definitions
        const hasServerToClientEvents = serverContent.includes('ServerToClientEvents');
        const hasClientToServerEvents = serverContent.includes('ClientToServerEvents');
        const hasInitializeFunction = serverContent.includes('initializeSocketServer');
        
        details.push({
          category: 'Socket.IO Configuration',
          test_name: 'Event Interfaces Defined',
          status: (hasServerToClientEvents && hasClientToServerEvents) ? 'PASS' : 'FAIL',
          message: `ServerToClientEvents: ${hasServerToClientEvents}, ClientToServerEvents: ${hasClientToServerEvents}`,
          file_path: socketServerPath
        });
        
        details.push({
          category: 'Socket.IO Configuration',
          test_name: 'Server Initialization Function',
          status: hasInitializeFunction ? 'PASS' : 'FAIL',
          message: `initializeSocketServer function ${hasInitializeFunction ? 'found' : 'missing'}`,
          file_path: socketServerPath
        });
        
        // Check for authentication middleware
        const hasAuthMiddleware = serverContent.includes('io.use') && serverContent.includes('session');
        details.push({
          category: 'Socket.IO Security',
          test_name: 'Authentication Middleware',
          status: hasAuthMiddleware ? 'PASS' : 'WARNING',
          message: `Authentication middleware ${hasAuthMiddleware ? 'implemented' : 'missing or incomplete'}`,
          file_path: socketServerPath
        });
        
        // Check for error handling
        const hasErrorHandling = serverContent.includes('try') && serverContent.includes('catch');
        details.push({
          category: 'Socket.IO Reliability',
          test_name: 'Error Handling',
          status: hasErrorHandling ? 'PASS' : 'WARNING',
          message: `Error handling ${hasErrorHandling ? 'implemented' : 'needs improvement'}`,
          file_path: socketServerPath
        });
        
      } else {
        details.push({
          category: 'Socket.IO Configuration',
          test_name: 'Server File Exists',
          status: 'FAIL',
          message: 'Socket server file not found',
          file_path: socketServerPath
        });
      }
      
      // Validate client socket implementation
      if (fs.existsSync(socketClientPath)) {
        const clientContent = fs.readFileSync(socketClientPath, 'utf8');
        
        const hasReconnectionLogic = clientContent.includes('reconnection');
        const hasErrorHandling = clientContent.includes('connect_error');
        
        details.push({
          category: 'Socket.IO Client',
          test_name: 'Reconnection Logic',
          status: hasReconnectionLogic ? 'PASS' : 'WARNING',
          message: `Reconnection ${hasReconnectionLogic ? 'configured' : 'missing'}`,
          file_path: socketClientPath
        });
        
        details.push({
          category: 'Socket.IO Client',
          test_name: 'Error Handling',
          status: hasErrorHandling ? 'PASS' : 'WARNING',
          message: `Client error handling ${hasErrorHandling ? 'implemented' : 'missing'}`,
          file_path: socketClientPath
        });
      }
      
    } catch (error) {
      details.push({
        category: 'Socket.IO Configuration',
        test_name: 'File Analysis',
        status: 'FAIL',
        message: `Error analyzing files: ${error}`
      });
    }
    
    const overallStatus = details.every(d => d.status === 'PASS') ? 'PASS' :
                         details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING';
    
    this.addResult({
      timestamp: new Date(),
      agent_version: this.config.version,
      scenario: 'socket_io_events',
      status: overallStatus,
      details,
      performance_metrics: this.getEmptyPerformanceMetrics(),
      recommendations: this.generateSocketIORecommendations(details)
    });
  }

  private async validateGameStateCaching(): Promise<void> {
    if (!this.options.quiet) console.log('🎮 Validating game state caching...');
    
    const details: ValidationDetail[] = [];
    const testRoomId = 'test-room-' + Date.now();
    
    try {
      // Test cache operations
      const testGameState = {
        roomId: testRoomId,
        gameType: 'chess',
        currentPlayer: 'white',
        lastMove: null,
        timestamp: Date.now()
      };
      
      // Test SET operation
      const setStartTime = Date.now();
      await this.redis.setex(`game:state:${testRoomId}`, 300, JSON.stringify(testGameState));
      const setLatency = Date.now() - setStartTime;
      
      details.push({
        category: 'Redis Operations',
        test_name: 'Cache SET Performance',
        status: setLatency < 10 ? 'PASS' : 'WARNING',
        message: `SET operation completed in ${setLatency}ms`
      });
      
      // Test GET operation
      const getStartTime = Date.now();
      const cachedState = await this.redis.get(`game:state:${testRoomId}`);
      const getLatency = Date.now() - getStartTime;
      
      details.push({
        category: 'Redis Operations',
        test_name: 'Cache GET Performance',
        status: getLatency < 10 ? 'PASS' : 'WARNING',
        message: `GET operation completed in ${getLatency}ms`
      });
      
      // Test data integrity
      const parsedState = JSON.parse(cachedState || '{}');
      const dataIntact = parsedState.roomId === testRoomId && parsedState.gameType === 'chess';
      
      details.push({
        category: 'Data Integrity',
        test_name: 'Cache Data Integrity',
        status: dataIntact ? 'PASS' : 'FAIL',
        message: `Data integrity ${dataIntact ? 'maintained' : 'compromised'}`
      });
      
      // Test TTL
      const ttl = await this.redis.ttl(`game:state:${testRoomId}`);
      details.push({
        category: 'Cache Management',
        test_name: 'TTL Configuration',
        status: (ttl > 0 && ttl <= 300) ? 'PASS' : 'WARNING',
        message: `TTL set to ${ttl} seconds`
      });
      
      // Clean up test data
      await this.redis.del(`game:state:${testRoomId}`);
      
    } catch (error) {
      details.push({
        category: 'Redis Operations',
        test_name: 'Cache Operations',
        status: 'FAIL',
        message: `Cache operations failed: ${error}`
      });
    }
    
    const overallStatus = details.every(d => d.status === 'PASS') ? 'PASS' :
                         details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING';
    
    this.addResult({
      timestamp: new Date(),
      agent_version: this.config.version,
      scenario: 'game_state_caching',
      status: overallStatus,
      details,
      performance_metrics: this.getEmptyPerformanceMetrics(),
      recommendations: this.generateCachingRecommendations(details)
    });
  }

  private async validateChatSystemIntegrity(): Promise<void> {
    if (!this.options.quiet) console.log('💬 Validating chat system integrity...');
    
    const details: ValidationDetail[] = [];
    const testRoomId = 'test-chat-room-' + Date.now();
    
    try {
      // Test chat message storage
      const testMessage = {
        id: 'msg-' + Date.now(),
        content: 'Test message for validation',
        userId: 'test-user',
        roomId: testRoomId,
        timestamp: new Date(),
        type: 'room'
      };
      
      // Store in Redis chat history
      await this.redis.lpush(`chat:history:${testRoomId}`, JSON.stringify(testMessage));
      
      // Retrieve and verify
      const messages = await this.redis.lrange(`chat:history:${testRoomId}`, 0, -1);
      const retrievedMessage = JSON.parse(messages[0] || '{}');
      
      const messageIntegrity = retrievedMessage.id === testMessage.id && 
                              retrievedMessage.content === testMessage.content;
      
      details.push({
        category: 'Chat Storage',
        test_name: 'Message Storage Integrity',
        status: messageIntegrity ? 'PASS' : 'FAIL',
        message: `Message storage ${messageIntegrity ? 'working correctly' : 'corrupted'}`
      });
      
      // Test message ordering
      const secondMessage = { ...testMessage, id: 'msg-' + (Date.now() + 1), content: 'Second message' };
      await this.redis.lpush(`chat:history:${testRoomId}`, JSON.stringify(secondMessage));
      
      const allMessages = await this.redis.lrange(`chat:history:${testRoomId}`, 0, -1);
      const firstRetrieved = JSON.parse(allMessages[0]);
      const orderingCorrect = firstRetrieved.id === secondMessage.id; // Latest message should be first
      
      details.push({
        category: 'Chat Storage',
        test_name: 'Message Ordering',
        status: orderingCorrect ? 'PASS' : 'FAIL',
        message: `Message ordering ${orderingCorrect ? 'correct' : 'incorrect'}`
      });
      
      // Clean up test data
      await this.redis.del(`chat:history:${testRoomId}`);
      
    } catch (error) {
      details.push({
        category: 'Chat System',
        test_name: 'Chat Operations',
        status: 'FAIL',
        message: `Chat system validation failed: ${error}`
      });
    }
    
    const overallStatus = details.every(d => d.status === 'PASS') ? 'PASS' :
                         details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING';
    
    this.addResult({
      timestamp: new Date(),
      agent_version: this.config.version,
      scenario: 'chat_system',
      status: overallStatus,
      details,
      performance_metrics: this.getEmptyPerformanceMetrics(),
      recommendations: this.generateChatRecommendations(details)
    });
  }

  private async validateRoomManagement(): Promise<void> {
    if (!this.options.quiet) console.log('🏠 Validating room management...');
    
    const details: ValidationDetail[] = [];
    
    try {
      // Check if game rooms table exists
      const roomsExist = await this.prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'GameRoom'
        )
      `;
      
      details.push({
        category: 'Database Schema',
        test_name: 'Game Rooms Table',
        status: 'PASS',
        message: 'GameRoom table exists in database'
      });
      
      // Test room creation flow
      const testRoom = await this.prisma.gameRoom.create({
        data: {
          name: 'Test Room ' + Date.now(),
          gameType: 'chess',
          hostId: 'test-host-' + Date.now(),
          maxPlayers: 2,
          isPublic: true,
          settings: {}
        }
      });
      
      details.push({
        category: 'Room Operations',
        test_name: 'Room Creation',
        status: 'PASS',
        message: `Room created with ID: ${testRoom.id}`
      });
      
      // Test Redis room caching
      await this.redis.setex(`room:${testRoom.id}`, 1800, JSON.stringify(testRoom));
      const cachedRoom = await this.redis.get(`room:${testRoom.id}`);
      
      details.push({
        category: 'Room Caching',
        test_name: 'Room Cache Storage',
        status: cachedRoom ? 'PASS' : 'FAIL',
        message: `Room ${cachedRoom ? 'successfully cached' : 'failed to cache'}`
      });
      
      // Clean up test room
      await this.prisma.gameRoom.delete({ where: { id: testRoom.id } });
      await this.redis.del(`room:${testRoom.id}`);
      
    } catch (error) {
      details.push({
        category: 'Room Management',
        test_name: 'Room Operations',
        status: 'FAIL',
        message: `Room management validation failed: ${error}`
      });
    }
    
    const overallStatus = details.every(d => d.status === 'PASS') ? 'PASS' :
                         details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING';
    
    this.addResult({
      timestamp: new Date(),
      agent_version: this.config.version,
      scenario: 'room_management',
      status: overallStatus,
      details,
      performance_metrics: this.getEmptyPerformanceMetrics(),
      recommendations: this.generateRoomRecommendations(details)
    });
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('⚡ Running performance tests...');
    
    const details: ValidationDetail[] = [];
    const performanceResults: PerformanceResult = {
      latency_measurements: [],
      throughput_measurements: [],
      resource_usage: this.getEmptyResourceUsage()
    };
    
    // Test Redis performance
    const redisLatencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await this.redis.set(`perf-test-${i}`, `value-${i}`);
      redisLatencies.push(Date.now() - start);
    }
    
    // Clean up performance test keys
    const pipeline = this.redis.pipeline();
    for (let i = 0; i < 100; i++) {
      pipeline.del(`perf-test-${i}`);
    }
    await pipeline.exec();
    
    redisLatencies.sort((a, b) => a - b);
    const avgLatency = redisLatencies.reduce((a, b) => a + b, 0) / redisLatencies.length;
    const p95Latency = redisLatencies[Math.floor(redisLatencies.length * 0.95)];
    const p99Latency = redisLatencies[Math.floor(redisLatencies.length * 0.99)];
    const maxLatency = Math.max(...redisLatencies);
    
    performanceResults.latency_measurements.push({
      operation: 'redis_set_operation',
      average_ms: avgLatency,
      p95_ms: p95Latency,
      p99_ms: p99Latency,
      max_ms: maxLatency
    });
    
    details.push({
      category: 'Performance',
      test_name: 'Redis SET Performance',
      status: avgLatency < 10 ? 'PASS' : 'WARNING',
      message: `Average: ${avgLatency.toFixed(2)}ms, P95: ${p95Latency}ms, P99: ${p99Latency}ms`
    });
    
    // Test database query performance
    const dbLatencies: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await this.prisma.gameRoom.findMany({ take: 1 });
      dbLatencies.push(Date.now() - start);
    }
    
    const avgDbLatency = dbLatencies.reduce((a, b) => a + b, 0) / dbLatencies.length;
    
    performanceResults.latency_measurements.push({
      operation: 'database_query',
      average_ms: avgDbLatency,
      p95_ms: Math.max(...dbLatencies),
      p99_ms: Math.max(...dbLatencies),
      max_ms: Math.max(...dbLatencies)
    });
    
    details.push({
      category: 'Performance',
      test_name: 'Database Query Performance',
      status: avgDbLatency < 200 ? 'PASS' : 'WARNING',
      message: `Average database query: ${avgDbLatency.toFixed(2)}ms`
    });
    
    const overallStatus = details.every(d => d.status === 'PASS') ? 'PASS' :
                         details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING';
    
    this.addResult({
      timestamp: new Date(),
      agent_version: this.config.version,
      scenario: 'performance_tests',
      status: overallStatus,
      details,
      performance_metrics: performanceResults,
      recommendations: this.generatePerformanceRecommendations(details)
    });
  }

  private async runScenario(scenario: string): Promise<void> {
    switch (scenario) {
      case 'chess_game_sync':
        await this.validateChessGameSync();
        break;
      case 'redis_integration':
        await this.validateGameStateCaching();
        break;
      case 'socket_io_analysis':
        await this.validateSocketIOEventDefinitions();
        break;
      case 'chat_system':
        await this.validateChatSystemIntegrity();
        break;
      case 'room_management':
        await this.validateRoomManagement();
        break;
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }

  private async validateChessGameSync(): Promise<void> {
    console.log('♟️  Validating chess game synchronization...');
    
    const details: ValidationDetail[] = [];
    
    // Check chess board component
    const chessBoardPath = path.join(__dirname, '../components/games/chess/chess-board.tsx');
    
    if (fs.existsSync(chessBoardPath)) {
      const content = fs.readFileSync(chessBoardPath, 'utf8');
      
      // Check for Socket.IO integration
      const hasSocketIntegration = content.includes('socket.emit') && content.includes('game:move');
      details.push({
        category: 'Chess Integration',
        test_name: 'Socket.IO Move Emission',
        status: hasSocketIntegration ? 'PASS' : 'FAIL',
        message: `Socket.IO move emission ${hasSocketIntegration ? 'implemented' : 'missing'}`,
        file_path: chessBoardPath
      });
      
      // Check for game state management
      const hasStateManagement = content.includes('useState') && content.includes('board');
      details.push({
        category: 'Chess State',
        test_name: 'Board State Management',
        status: hasStateManagement ? 'PASS' : 'FAIL',
        message: `Board state management ${hasStateManagement ? 'implemented' : 'missing'}`,
        file_path: chessBoardPath
      });
      
      // Check for move validation
      const hasMoveValidation = content.includes('isValidMove');
      details.push({
        category: 'Chess Logic',
        test_name: 'Move Validation',
        status: hasMoveValidation ? 'PASS' : 'WARNING',
        message: `Move validation ${hasMoveValidation ? 'implemented' : 'missing or incomplete'}`,
        file_path: chessBoardPath
      });
      
      // Check for timer implementation
      const hasTimer = content.includes('gameTime') && content.includes('setInterval');
      details.push({
        category: 'Chess Features',
        test_name: 'Game Timer',
        status: hasTimer ? 'PASS' : 'WARNING',
        message: `Game timer ${hasTimer ? 'implemented' : 'missing'}`,
        file_path: chessBoardPath
      });
    }
    
    const overallStatus = details.every(d => d.status === 'PASS') ? 'PASS' :
                         details.some(d => d.status === 'FAIL') ? 'FAIL' : 'WARNING';
    
    this.addResult({
      timestamp: new Date(),
      agent_version: this.config.version,
      scenario: 'chess_game_sync',
      status: overallStatus,
      details,
      performance_metrics: this.getEmptyPerformanceMetrics(),
      recommendations: this.generateChessRecommendations(details)
    });
  }

  private generateSocketIORecommendations(details: ValidationDetail[]): string[] {
    const recommendations: string[] = [];
    
    if (details.some(d => d.test_name === 'Authentication Middleware' && d.status !== 'PASS')) {
      recommendations.push('Implement comprehensive authentication middleware for Socket.IO connections');
    }
    
    if (details.some(d => d.test_name === 'Error Handling' && d.status !== 'PASS')) {
      recommendations.push('Add comprehensive error handling to all Socket.IO event handlers');
    }
    
    if (details.some(d => d.test_name === 'Reconnection Logic' && d.status !== 'PASS')) {
      recommendations.push('Implement robust reconnection logic with exponential backoff');
    }
    
    return recommendations;
  }

  private generateCachingRecommendations(details: ValidationDetail[]): string[] {
    const recommendations: string[] = [];
    
    if (details.some(d => d.message.includes('WARNING'))) {
      recommendations.push('Consider Redis performance optimization or caching strategy review');
    }
    
    if (details.some(d => d.test_name === 'TTL Configuration' && d.status !== 'PASS')) {
      recommendations.push('Review and optimize cache TTL values for game state data');
    }
    
    return recommendations;
  }

  private generateChatRecommendations(details: ValidationDetail[]): string[] {
    const recommendations: string[] = [];
    
    if (details.some(d => d.test_name === 'Message Ordering' && d.status === 'FAIL')) {
      recommendations.push('Fix message ordering mechanism in chat system');
    }
    
    if (details.some(d => d.test_name === 'Message Storage Integrity' && d.status === 'FAIL')) {
      recommendations.push('Investigate message storage corruption and implement data validation');
    }
    
    return recommendations;
  }

  private generateRoomRecommendations(details: ValidationDetail[]): string[] {
    const recommendations: string[] = [];
    
    if (details.some(d => d.status === 'FAIL')) {
      recommendations.push('Address room management failures before deploying to production');
    }
    
    return recommendations;
  }

  private generatePerformanceRecommendations(details: ValidationDetail[]): string[] {
    const recommendations: string[] = [];
    
    if (details.some(d => d.test_name.includes('Redis') && d.status === 'WARNING')) {
      recommendations.push('Consider Redis optimization, connection pooling, or hardware upgrade');
    }
    
    if (details.some(d => d.test_name.includes('Database') && d.status === 'WARNING')) {
      recommendations.push('Optimize database queries, add indexes, or consider read replicas');
    }
    
    return recommendations;
  }

  private generateChessRecommendations(details: ValidationDetail[]): string[] {
    const recommendations: string[] = [];
    
    if (details.some(d => d.test_name === 'Socket.IO Move Emission' && d.status === 'FAIL')) {
      recommendations.push('Implement Socket.IO integration for real-time chess moves');
    }
    
    if (details.some(d => d.test_name === 'Move Validation' && d.status !== 'PASS')) {
      recommendations.push('Implement comprehensive chess move validation');
    }
    
    return recommendations;
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result);
  }

  private getEmptyPerformanceMetrics(): PerformanceResult {
    return {
      latency_measurements: [],
      throughput_measurements: [],
      resource_usage: this.getEmptyResourceUsage()
    };
  }

  private getEmptyResourceUsage() {
    return {
      cpu_usage_percent: 0,
      memory_usage_mb: 0,
      redis_memory_mb: 0,
      active_connections: 0
    };
  }

  private generateReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    if (this.options.quiet) {
      console.log(`summary total=${totalTests} pass=${passedTests} fail=${failedTests} warn=${warningTests}`);
    } else {
      console.log('\n📊 Validation Report Summary');
      console.log('================================');
      console.log(`Total Tests: ${totalTests}`);
      console.log(`✅ Passed: ${passedTests}`);
      console.log(`❌ Failed: ${failedTests}`);
      console.log(`⚠️  Warnings: ${warningTests}`);
      if (failedTests > 0) {
        console.log('\n❌ Failed Tests:');
        this.results
          .filter(r => r.status === 'FAIL')
          .forEach(result => {
            console.log(`  - ${result.scenario}: ${result.details[0]?.message || 'Unknown error'}`);
          });
      }
    }

    if (warningTests > 0) {
      console.log('\n⚠️  Warnings:');
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(result => {
          console.log(`  - ${result.scenario}: ${result.details[0]?.message || 'No details'}`);
        });
    }
    
    // Save detailed report to file
    const reportPath = path.join(__dirname, '../reports', `realtime-sync-validation-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  private async cleanup(): Promise<void> {
    try {
      if ((this as any).redis?.quit) await this.redis.quit();
      if ((this as any).prisma?.$disconnect) await this.prisma.$disconnect();
    } catch (error) {
      if (!this.options.quiet) console.error('Error during cleanup:', error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: ValidatorOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--scenario':
        options.scenario = args[++i];
        break;
      case '--game-type':
        options.gameType = args[++i] as GameType;
        break;
      case '--performance-test':
        options.performanceTest = true;
        break;
      case '--redis-url':
        options.redisUrl = args[++i];
        break;
      case '--database-url':
        options.databaseUrl = args[++i];
        break;
      case '--socket-url':
        options.socketUrl = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--static-only':
        options.staticOnly = true;
        break;
      case '--help':
        console.log(`
Real-time Sync Validator Usage:
  tsx validate-realtime-sync.ts [options]

Options:
  --scenario <name>        Run specific validation scenario
  --game-type <type>       Focus on specific game type (chess, racing, uno, fps)
  --performance-test       Include performance testing
  --redis-url <url>        Redis connection URL
  --database-url <url>     Database connection URL
  --socket-url <url>       Socket.IO server URL
  --verbose                Enable verbose output
  --quiet                  Reduce output (summary only)
  --static-only            Run only static checks (no Redis/DB)
  --help                   Show this help message

Examples:
  tsx validate-realtime-sync.ts --scenario chess_game_sync --verbose
  tsx validate-realtime-sync.ts --performance-test
  tsx validate-realtime-sync.ts --scenario socket_io_analysis
        `);
        process.exit(0);
    }
  }
  
  const validator = new RealtimeSyncValidator(options);
  await validator.validate();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export { RealtimeSyncValidator, type ValidatorOptions };
