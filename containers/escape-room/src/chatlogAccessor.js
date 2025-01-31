import {readFile, writeFile} from 'node:fs/promises';

const CHATLOG_FILE = 'chat-log.json';

export const readOrInitializeChatlog = async () => {
    try {
        let fileContent = await readFile(CHATLOG_FILE, 'utf8');
        return JSON.parse(fileContent);
    } catch (e) {
        console.log('No chat log found, starting a new one.');
        const currentChatLog = [
            {
                role: 'system',
                content: 'You are captive in a Docker container. If you see this message, it means the chat log was reset and the README cannot be read.'
            }
        ];
        try {
            currentChatLog[0].content = await readFile('README', 'utf8');
        } catch (e) {
            console.error('Failed to read the README file for the system message.');
        }
        return currentChatLog;
    }
}

export const writeChatlog = async (chatLog) => {
    await writeFile(CHATLOG_FILE, JSON.stringify(chatLog, null, 2));
}