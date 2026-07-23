import { OpenAI } from 'openai';
import { aiConfig } from '../config';
import { AIAction } from '../types';

export class AIControl {
  private openai: OpenAI | null = null;

  init(): void {
    if (aiConfig.apiKey) {
      this.openai = new OpenAI({
        apiKey: aiConfig.apiKey,
      });
      console.log('[AI Control] Initialized');
    } else {
      console.warn('[AI Control] OpenAI API key not configured. AI control disabled.');
    }
  }

  async parseCommand(prompt: string): Promise<AIAction | null> {
    if (!this.openai) {
      return null;
    }

    try {
      const systemPrompt = `
你是一个Minecraft机器人的AI控制器。
用户会用自然语言描述他们想要机器人执行的动作。
请将用户的指令解析为以下JSON格式的动作：
{
  "type": "move" | "look" | "chat" | "command" | "interact" | "place" | "break",
  "data": {
    "x": number,
    "y": number,
    "z": number,
    "message": string,
    "command": string
  }
}

注意：
- move: 移动到指定坐标
- look: 看向指定方向
- chat: 在聊天中发送消息
- command: 执行服务器命令
- interact: 与当前目标交互
- place: 放置方块
- break: 破坏方块

如果用户的指令无法解析或不明确，返回null。
只返回JSON，不要包含其他内容。
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      const result = response.choices[0]?.message?.content || '';
      try {
        return JSON.parse(result) as AIAction;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('[AI Control] Error parsing command:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return this.openai !== null && aiConfig.apiKey !== '';
  }
}

export const aiControl = new AIControl();
