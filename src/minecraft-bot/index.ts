import mc from 'minecraft-protocol';
import forgeMod from '@tcortega/minecraft-protocol-forge';
import { botConfig } from '../config';
import { ChatMessage } from '../types';

export class MinecraftBot {
  private client: mc.Client | null = null;
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: ((reason: string) => void) | null = null;

  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.pingServer();

        this.client = mc.createClient({
          host: botConfig.host,
          port: botConfig.port,
          username: botConfig.username,
          password: botConfig.password,
          version: false as any,
          auth: botConfig.password ? 'microsoft' : 'offline',
        });

        (forgeMod as any).autoVersionForge(this.client);

        this.client.on('connect', () => {
          console.log('[Minecraft] Connected to server');
        });

        this.client.on('login', () => {
          console.log('[Minecraft] Logged in successfully');
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

  private async pingServer(): Promise<void> {
    return new Promise((resolve) => {
      mc.ping({
        host: botConfig.host,
        port: botConfig.port,
        version: '1.20.1',
      }, (err, response) => {
        if (err) {
          console.log('[Minecraft] Ping failed:', err);
          resolve();
          return;
        }
        console.log('[Minecraft] Ping response keys:', Object.keys(response));
        if (response.description) {
          console.log('[Minecraft] Server name:', response.description);
        }
        if (response.modinfo) {
          console.log('[Minecraft] modinfo type:', response.modinfo.type);
          if (response.modinfo.modList && response.modinfo.modList.length > 0) {
            console.log('[Minecraft] modList count:', response.modinfo.modList.length);
            console.log('[Minecraft] modList sample:', JSON.stringify(response.modinfo.modList.slice(0, 10)));
          }
        }
        if (response.forgeData) {
          console.log('[Minecraft] forgeData keys:', Object.keys(response.forgeData));
          if (response.forgeData.mods && response.forgeData.mods.length > 0) {
            console.log('[Minecraft] forgeData mods count:', response.forgeData.mods.length);
          }
        }
        resolve();
      });
    });
  }
}

export const minecraftBot = new MinecraftBot();
