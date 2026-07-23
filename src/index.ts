import { minecraftBot } from './minecraft-bot';
import { aiChat } from './ai-chat';
import { aiControl } from './ai-control';
import { webUI } from './webui';
import { ChatMessage } from './types';

async function handleChatMessage(message: ChatMessage): Promise<void> {
  console.log(`[Chat] ${message.sender}: ${message.content}`);

  webUI.sendChatMessage(message);

  aiChat.addToHistory(message);

  if (message.content.startsWith('!') || message.content.startsWith('/ai')) {
    const prompt = message.content.replace(/^[!/]ai\s*/, '').replace(/^!/, '');
    if (prompt.trim()) {
      try {
        const response = await aiChat.generateResponse(prompt, message.sender);
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'CTNH_Bot',
          content: response,
          timestamp: Date.now(),
          isAI: true,
        };
        minecraftBot.sendMessage(response);
        webUI.sendChatMessage(aiMessage);
        aiChat.addToHistory(aiMessage);
      } catch (error) {
        console.error('[AI] Error generating response:', error);
      }
    }
  }
}

async function handleCommand(command: string): Promise<void> {
  console.log(`[Command] Executing: ${command}`);
  minecraftBot.sendCommand(command);
}

async function handleMessage(message: string): Promise<void> {
  console.log(`[Message] Sending: ${message}`);
  minecraftBot.sendMessage(message);

  const action = await aiControl.parseCommand(message);
  if (action) {
    console.log(`[AI Control] Parsed action: ${JSON.stringify(action)}`);
    switch (action.type) {
      case 'command':
        if (action.data?.command) {
          minecraftBot.sendCommand(action.data.command);
        }
        break;
      case 'chat':
        if (action.data?.message) {
          minecraftBot.sendMessage(action.data.message);
        }
        break;
      case 'move':
        console.log('[AI Control] Move action received (not implemented)');
        break;
      case 'look':
        console.log('[AI Control] Look action received (not implemented)');
        break;
      case 'interact':
        console.log('[AI Control] Interact action received (not implemented)');
        break;
      case 'place':
        console.log('[AI Control] Place action received (not implemented)');
        break;
      case 'break':
        console.log('[AI Control] Break action received (not implemented)');
        break;
    }
  }
}

async function connectToServer(): Promise<void> {
  try {
    await minecraftBot.connect();
    webUI.sendStatusUpdate({ connected: true });
  } catch (error) {
    console.error('[Main] Failed to connect:', error);
    webUI.sendStatusUpdate({ connected: false, error: error instanceof Error ? error.message : 'Connection failed' });
  }
}

function disconnectFromServer(): void {
  minecraftBot.disconnect();
  webUI.sendStatusUpdate({ connected: false });
}

function setupEventHandlers(): void {
  minecraftBot.onMessage(handleChatMessage);
  minecraftBot.onConnect(() => {
    webUI.sendStatusUpdate({ connected: true });
  });
  minecraftBot.onDisconnect((reason) => {
    webUI.sendStatusUpdate({ connected: false, error: reason });
  });

  webUI.onCommand(handleCommand);
  webUI.onMessage(handleMessage);
  webUI.onConnect(connectToServer);
  webUI.onDisconnect(disconnectFromServer);
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('         CTNH Bot - Starting Up');
  console.log('========================================');

  aiChat.init();
  aiControl.init();

  setupEventHandlers();

  webUI.start();

  console.log('========================================');
  console.log('         CTNH Bot - Ready');
  console.log('========================================');
  console.log('WebUI: http://localhost:3000');
  console.log('AI Chat:', aiChat.isAvailable() ? 'Enabled' : 'Disabled (API key not set)');
  console.log('========================================');
}

main().catch(console.error);
