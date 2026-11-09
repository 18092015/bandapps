import type { UIMessage } from 'ai';
export function canSave(userId: string | null) { return Boolean(userId); }
export function ownsThread(userId: string, ownerId: string) { return userId === ownerId; }
export function messageText(message: UIMessage) { return message.parts.filter(p => p.type === 'text').map(p => p.type === 'text' ? p.text : '').join('\n'); }
export function filePath(userId: string, id: string, name: string) { return `${userId}/${id}--${name.replace(/[^\p{L}\p{N}._ -]/gu, '_')}`; }
