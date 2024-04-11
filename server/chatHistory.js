import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatHistoryPath = path.join(__dirname, 'chat_history.json');

function readChatHistory(){
    return new Promise((resolve, reject) => {
        fs.readFile(chatHistoryPath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

// Fonction pour ajouter une entrée à l'historique des chats
function addToChatHistory(entry) {
    return new Promise(async (resolve, reject) => {
        try {
            const history = await readChatHistory();
            history.push(entry);
            fs.writeFile(chatHistoryPath, JSON.stringify(history, null, 2), (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

export { readChatHistory, addToChatHistory };

