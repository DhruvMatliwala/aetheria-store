import { TELEGRAM_BOT_TOKEN } from '@/lib/constants';

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface KeyboardButton {
  text: string;
  web_app?: { url: string };
  request_contact?: boolean;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  is_persistent?: boolean;
}

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  reply_markup?: InlineKeyboardMarkup | any;
  disable_web_page_preview?: boolean;
}

export interface SendPhotoOptions {
  caption?: string;
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  reply_markup?: InlineKeyboardMarkup | any;
}

export interface EditMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  reply_markup?: InlineKeyboardMarkup | any;
  disable_web_page_preview?: boolean;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance?: string;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

function getBaseUrl(token?: string): string {
  const t = token || TELEGRAM_BOT_TOKEN;
  if (!t) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured.');
  }
  return `https://api.telegram.org/bot${t}`;
}

/**
 * Execute Telegram API call
 */
async function callTelegramApi<T = any>(
  method: string,
  payload: Record<string, any>,
  token?: string
): Promise<{ ok: boolean; result?: T; description?: string; error_code?: number }> {
  try {
    const baseUrl = getBaseUrl(token);
    const res = await fetch(`${baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error(`[TelegramAPI:${method}] Error:`, data);
    }
    return data;
  } catch (err) {
    console.error(`[TelegramAPI:${method}] Network Exception:`, err);
    return { ok: false, description: String(err) };
  }
}

/**
 * Send text message to a chat
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options: SendMessageOptions = {},
  token?: string
) {
  return callTelegramApi(
    'sendMessage',
    {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode ?? 'HTML',
      disable_web_page_preview: options.disable_web_page_preview ?? true,
      reply_markup: options.reply_markup,
    },
    token
  );
}

/**
 * Send photo with caption to a chat
 */
export async function sendTelegramPhoto(
  chatId: number | string,
  photoUrl: string,
  options: SendPhotoOptions = {},
  token?: string
) {
  return callTelegramApi(
    'sendPhoto',
    {
      chat_id: chatId,
      photo: photoUrl,
      caption: options.caption,
      parse_mode: options.parse_mode ?? 'HTML',
      reply_markup: options.reply_markup,
    },
    token
  );
}

/**
 * Edit existing message text
 */
export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  options: EditMessageOptions = {},
  token?: string
) {
  return callTelegramApi(
    'editMessageText',
    {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options.parse_mode ?? 'HTML',
      disable_web_page_preview: options.disable_web_page_preview ?? true,
      reply_markup: options.reply_markup,
    },
    token
  );
}

/**
 * Delete message from chat
 */
export async function deleteTelegramMessage(
  chatId: number | string,
  messageId: number,
  token?: string
) {
  return callTelegramApi(
    'deleteMessage',
    {
      chat_id: chatId,
      message_id: messageId,
    },
    token
  );
}

/**
 * Answer callback query (dismiss spinner on inline buttons)
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false,
  token?: string
) {
  return callTelegramApi(
    'answerCallbackQuery',
    {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    },
    token
  );
}

/**
 * Configure webhook URL
 */
export async function setTelegramWebhook(
  url: string,
  secretToken?: string,
  token?: string
) {
  return callTelegramApi(
    'setWebhook',
    {
      url,
      secret_token: secretToken,
      drop_pending_updates: false,
      allowed_updates: ['message', 'callback_query'],
    },
    token
  );
}

/**
 * Get current webhook status
 */
export async function getTelegramWebhookInfo(token?: string) {
  return callTelegramApi('getWebhookInfo', {}, token);
}

/**
 * Set default bot slash commands
 */
export async function setTelegramCommands(
  commands: { command: string; description: string }[],
  token?: string
) {
  return callTelegramApi('setMyCommands', { commands }, token);
}

/**
 * Set the chat menu button (e.g. to launch Web App Mini App)
 */
export async function setTelegramChatMenuButton(
  menuButton: {
    type: 'web_app' | 'default' | 'commands';
    text?: string;
    web_app?: { url: string };
  },
  token?: string
) {
  return callTelegramApi('setChatMenuButton', { menu_button: menuButton }, token);
}
