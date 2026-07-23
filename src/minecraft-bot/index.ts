import mc from 'minecraft-protocol';
import forgeMod from '@tcortega/minecraft-protocol-forge';
import { botConfig } from '../config';
import { ChatMessage } from '../types';

export class MinecraftBot {
  private client: mc.Client | null = null;
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: ((reason: string) => void) | null = null;
  private serverMods: any[] = [];

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

        console.log('[Minecraft] serverMods count before handshake:', this.serverMods.length);
        if (this.serverMods.length > 0) {
          console.log('[Minecraft] Using server mods for handshake:', this.serverMods.length, 'mods');
          const forgeHandshake3 = require('@tcortega/minecraft-protocol-forge/src/client/forgeHandshake3');
          forgeHandshake3(this.client, { forgeMods: this.serverMods });
        } else {
          console.log('[Minecraft] No server mods found, using autoVersionForge');
          (forgeMod as any).autoVersionForge(this.client);
        }

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
        const res = response as any;
        console.log('[Minecraft] Ping response keys:', Object.keys(res));
        if (res.description) {
          console.log('[Minecraft] Server name:', res.description);
        }
        if (res.modinfo) {
          console.log('[Minecraft] modinfo type:', res.modinfo.type);
          if (res.modinfo.modList && res.modinfo.modList.length > 0) {
            console.log('[Minecraft] modList count:', res.modinfo.modList.length);
            console.log('[Minecraft] modList sample:', JSON.stringify(res.modinfo.modList.slice(0, 10)));
          }
        }
        if (res.forgeData) {
          console.log('[Minecraft] forgeData keys:', Object.keys(res.forgeData));
          console.log('[Minecraft] forgeData fmlNetworkVersion:', res.forgeData.fmlNetworkVersion);
          console.log('[Minecraft] forgeData truncated:', res.forgeData.truncated);
          console.log('[Minecraft] forgeData d:', typeof res.forgeData.d);
          if (res.forgeData.d && typeof res.forgeData.d === 'string') {
            console.log('[Minecraft] forgeData.d length:', res.forgeData.d.length);
            console.log('[Minecraft] forgeData.d first 100 chars:', res.forgeData.d.substring(0, 100));
            try {
              const decoded = Buffer.from(res.forgeData.d, 'base64').toString('utf-8');
              console.log('[Minecraft] forgeData.d decoded:', decoded.substring(0, 500));
            } catch (e) {
              console.log('[Minecraft] forgeData.d decode error:', e);
            }
          }
          if (res.forgeData.mods) {
            console.log('[Minecraft] forgeData mods type:', typeof res.forgeData.mods);
            console.log('[Minecraft] forgeData mods keys:', Object.keys(res.forgeData.mods));
            console.log('[Minecraft] forgeData mods:', JSON.stringify(res.forgeData.mods));
            if (Array.isArray(res.forgeData.mods) && res.forgeData.mods.length > 0) {
              this.serverMods = res.forgeData.mods;
            } else if (typeof res.forgeData.mods === 'object') {
              const modList = Object.keys(res.forgeData.mods).map(key => ({
                modid: key,
                version: res.forgeData.mods[key]
              }));
              this.serverMods = modList;
              console.log('[Minecraft] Converted modList count:', modList.length);
            }
          } else {
            console.log('[Minecraft] forgeData.mods is undefined');
          }
        }
        resolve();
      });
    });
  }
}

export const minecraftBot = new MinecraftBot();
