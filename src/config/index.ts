import dotenv from 'dotenv';
import { BotConfig, AIConfig, WebUIConfig } from '../types';

dotenv.config();

export const botConfig: BotConfig = {
  host: process.env.MINECRAFT_SERVER_HOST || 'localhost',
  port: parseInt(process.env.MINECRAFT_SERVER_PORT || '25565'),
  username: process.env.MINECRAFT_BOT_USERNAME || 'CTNH_Bot',
  password: process.env.MINECRAFT_BOT_PASSWORD,
};

export const aiConfig: AIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4',
};

export const webUIConfig: WebUIConfig = {
  port: parseInt(process.env.WEBUI_PORT || '3000'),
};
