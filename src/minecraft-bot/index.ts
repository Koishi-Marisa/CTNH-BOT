import mineflayer from 'mineflayer';
import { botConfig } from '../config';
import { ChatMessage } from '../types';

export class MinecraftBot {
  private bot: mineflayer.Bot | null = null;
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: ((reason: string) => void) | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.bot = mineflayer.createBot({
          host: botConfig.host,
          port: botConfig.port,
          username: botConfig.username,
          password: botConfig.password,
          version: '1.20.1',
          auth: botConfig.password ? 'microsoft' : 'offline',
        });

        this.bot.on('login', () => {
          console.log('[Minecraft] Logged in to server');
          if (this.onConnectCallback) this.onConnectCallback();
          resolve();
        });

        this.bot.on('chat', (username, message) => {
          if (username === this.bot?.username) return;
          const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: username,
            content: message,
            timestamp: Date.now(),
            isAI: false,
          };
          if (this.onMessageCallback) this.onMessageCallback(chatMessage);
        });

        this.bot.on('end', (reason) => {
          console.log(`[Minecraft] Disconnected: ${reason || 'Unknown reason'}`);
          if (this.onDisconnectCallback) this.onDisconnectCallback(reason || 'Unknown');
        });

        this.bot.on('error', (err) => {
          console.error('[Minecraft] Error:', err);
          reject(err);
        });

        this.bot.on('spawn', () => {
          console.log('[Minecraft] Bot spawned');
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    if (this.bot) {
      this.bot.end();
      this.bot = null;
    }
  }

  sendMessage(message: string): void {
    if (this.bot) {
      this.bot.chat(message);
    }
  }

  sendCommand(command: string): void {
    if (this.bot) {
      this.bot.chat(`/${command}`);
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

  getBot(): mineflayer.Bot | null {
    return this.bot;
  }

  isConnected(): boolean {
    return this.bot !== null;
  }
}

export const minecraftBot = new MinecraftBot();
