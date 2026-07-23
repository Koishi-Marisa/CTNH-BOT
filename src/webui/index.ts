import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { webUIConfig } from '../config';
import { ChatMessage } from '../types';

export class WebUI {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private onCommandCallback: ((command: string) => void) | null = null;
  private onMessageCallback: ((message: string) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupRoutes();
    this.setupSocket();
  }

  private setupRoutes(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));

    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
      });
    });

    this.app.post('/api/command', (req, res) => {
      const { command } = req.body;
      if (command && this.onCommandCallback) {
        this.onCommandCallback(command);
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: 'Command not provided' });
      }
    });

    this.app.post('/api/message', (req, res) => {
      const { message } = req.body;
      if (message && this.onMessageCallback) {
        this.onMessageCallback(message);
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: 'Message not provided' });
      }
    });
  }

  private setupSocket(): void {
    this.io.on('connection', (socket) => {
      console.log('[WebUI] Client connected');

      socket.on('command', (command: string) => {
        if (this.onCommandCallback) {
          this.onCommandCallback(command);
        }
      });

      socket.on('message', (message: string) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      });

      socket.on('connect-mc', () => {
        if (this.onConnectCallback) {
          this.onConnectCallback();
        }
      });

      socket.on('disconnect-mc', () => {
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      });

      socket.on('disconnect', () => {
        console.log('[WebUI] Client disconnected');
      });
    });
  }

  start(): void {
    this.server.listen(webUIConfig.port, () => {
      console.log(`[WebUI] Server running on http://localhost:${webUIConfig.port}`);
    });
  }

  sendChatMessage(message: ChatMessage): void {
    this.io.emit('chat-message', message);
  }

  sendStatusUpdate(status: { connected: boolean; error?: string }): void {
    this.io.emit('status-update', status);
  }

  onCommand(callback: (command: string) => void): void {
    this.onCommandCallback = callback;
  }

  onMessage(callback: (message: string) => void): void {
    this.onMessageCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }
}

export const webUI = new WebUI();
