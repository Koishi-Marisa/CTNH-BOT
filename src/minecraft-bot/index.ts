import mc from 'minecraft-protocol';
import { botConfig } from '../config';
import { ChatMessage } from '../types';

export class MinecraftBot {
  private client: mc.Client | null = null;
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: ((reason: string) => void) | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client = mc.createClient({
          host: botConfig.host,
          port: botConfig.port,
          username: botConfig.username,
          password: botConfig.password,
          version: '1.20.1',
          auth: botConfig.password ? 'microsoft' : 'offline',
          forge: true,
        });

        this.client.on('connect', () => {
          console.log('[Minecraft] Connected to server');
          if (this.onConnectCallback) this.onConnectCallback();
          resolve();
        });

        this.client.on('chat', (packet) => {
          const message: ChatMessage = {
            id: Date.now().toString(),
            sender: this.extractSender(packet.message),
            content: this.extractContent(packet.message),
            timestamp: Date.now(),
            isAI: false,
          };
          if (this.onMessageCallback) this.onMessageCallback(message);
        });

        this.client.on('disconnect', (packet) => {
          const reason = packet.reason || 'Unknown reason';
          console.log(`[Minecraft] Disconnected: ${reason}`);
          if (this.onDisconnectCallback) this.onDisconnectCallback(reason);
        });

        this.client.on('error', (err) => {
          console.error('[Minecraft] Connection error:', err);
          reject(err);
        });

        this.client.on('spawn', () => {
          console.log('[Minecraft] Bot spawned');
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  sendMessage(message: string): void {
    if (this.client) {
      this.client.write('chat', { message });
    }
  }

  sendCommand(command: string): void {
    if (this.client) {
      this.client.write('chat', { message: `/${command}` });
    }
  }

  onMessage(callback: (message: ChatMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: (reason: string) => void): void {
    this.onDisconnectCallback = callback;
  }

  getClient(): mc.Client | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null && this.client.state === 'play';
  }

  private extractSender(message: string): string {
    const match = message.match(/^<([^>]+)>/);
    return match ? match[1] : 'System';
  }

  private extractContent(message: string): string {
    const match = message.match(/^<[^>]+>\s*(.+)$/);
    return match ? match[1] : message;
  }
}

export const minecraftBot = new MinecraftBot();
