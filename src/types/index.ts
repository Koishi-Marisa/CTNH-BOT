export interface BotConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
}

export interface AIConfig {
  apiKey: string;
  model: string;
}

export interface WebUIConfig {
  port: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isAI: boolean;
}

export interface AIAction {
  type: 'move' | 'look' | 'chat' | 'command' | 'interact' | 'place' | 'break';
  data?: {
    x?: number;
    y?: number;
    z?: number;
    message?: string;
    command?: string;
  };
}
