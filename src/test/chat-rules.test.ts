import { describe,it,expect } from 'vitest';
import { canSave,ownsThread,filePath,messageText } from '@/lib/chat-rules';
describe('Private conversations and files',()=>{
 it('requires login to save',()=>{expect(canSave(null)).toBe(false);expect(canSave('alex')).toBe(true);});
 it('only allows a conversation owner',()=>{expect(ownsThread('alex','alex')).toBe(true);expect(ownsThread('alex','other')).toBe(false);});
 it('isolates file paths by account',()=>{expect(filePath('alex','123','a/b.txt')).toBe('alex/123--a_b.txt');expect(filePath('other','123','a/b.txt')).not.toBe(filePath('alex','123','a/b.txt'));});
 it('keeps all text parts in a chat message',()=>{expect(messageText({id:'m',role:'assistant',parts:[{type:'text',text:'Primeira'},{type:'text',text:'Segunda'}]})).toBe('Primeira\nSegunda');});
});
