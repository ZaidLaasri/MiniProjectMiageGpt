import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from "fs";
import { promisify } from 'util';
const writeFileAsync = promisify(fs.writeFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatHistoryPath = path.join(__dirname, 'chat_history.json');
// Read chat history from JSON file
async function readChatHistory() {
    try {
        const data = await fs.promises.readFile(chatHistoryPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {

            return [];

    }
}

// Write chat history to JSON file
async function writeChatHistory(history) {
    try {
        await fs.promises.writeFile(chatHistoryPath, JSON.stringify(history, null, 2));
    } catch (error) {
        throw error;
    }
}

export { readChatHistory, writeChatHistory };

