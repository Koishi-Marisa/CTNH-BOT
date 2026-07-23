import { OpenAI } from 'openai';
import { aiConfig } from '../config';
import { ChatMessage } from '../types';

export class AIChat {
  private openai: OpenAI | null = null;
  private chatHistory: ChatMessage[] = [];
  private readonly MAX_HISTORY = 50;

  init(): void {
    if (aiConfig.apiKey) {
      this.openai = new OpenAI({
        apiKey: aiConfig.apiKey,
      });
      console.log('[AI] OpenAI initialized');
    } else {
      console.warn('[AI] OpenAI API key not configured. AI chat disabled.');
    }
  }

  async generateResponse(userMessage: string, sender: string): Promise<string> {
    if (!this.openai) {
      return 'AI chat is not configured. Please set OPENAI_API_KEY in environment variables.';
    }

    try {
      const systemPrompt = `
你是一个Minecraft CTNH整合包服务器的AI助手机器人。
请用中文回答玩家的问题，语气友好、幽默。
CTNH是一个科技魔法整合包，包含了许多mod，如Applied Energistics 2、Thermal Expansion、Botania等。
如果你不知道某个问题的答案，可以礼貌地告诉玩家你不知道，并建议他们查看游戏内的Wiki或询问其他玩家。
不要输出任何格式化的代码块，直接用自然语言回答。
回答要简洁，适合在游戏聊天中发送。
      `.trim();

      const historyMessages = this.chatHistory.slice(-10).map((msg) => ({
          role: (msg.isAI ? 'assistant' : 'user') as 'assistant' | 'user',
          content: `${msg.sender}: ${msg.content}`,
        }));

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...historyMessages,
        { role: 'user' as const, content: `${sender}: ${userMessage}` },
      ];

      const response = await this.openai.chat.completions.create({
        model: aiConfig.model,
        messages,
        temperature: 0.7,
        max_tokens: 200,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      return aiResponse.trim();
    } catch (error) {
      console.error('[AI] Error generating response:', error);
      return '抱歉，我现在无法回答你的问题。';
    }
  }

  addToHistory(message: ChatMessage): void {
    this.chatHistory.push(message);
    if (this.chatHistory.length > this.MAX_HISTORY) {
      this.chatHistory.shift();
    }
  }

  getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  clearHistory(): void {
    this.chatHistory = [];
  }

  isAvailable(): boolean {
    return this.openai !== null && aiConfig.apiKey !== '';
  }
}

export const aiChat = new AIChat();
