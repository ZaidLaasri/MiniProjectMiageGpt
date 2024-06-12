// generate minimal server for api with express
import express from 'express';
import { API_KEY } from './config.js';
import OpenAI from "openai";
// handle form data posted
import multer from 'multer';
import { readChatHistory, writeChatHistory } from './chatHistory.js';
import { v4 as uuidv4 } from 'uuid';




// create an instance of OpenAI with the api key
const openai = new OpenAI({
  apiKey: API_KEY,
});

const app = express();
const port = 3001;

// configure CORS support
// Pour accepter les connexions cross-domain (CORS)
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

// init multer to handle form data
const upload = multer();


// Handle new chat creation
app.post('/new-chat', upload.none(), async (req, res) => {
    try {
        const conversationID = uuidv4();
        const history = await readChatHistory();
        history.push({ conversationID, chats: [] });
        await writeChatHistory(history);
        res.json({ conversationID });
    } catch (error) {
        console.error("Failed to start a new chat:", error);
        res.status(500).json({ error: "Failed to start a new chat", details: error.message });
    }
});

// Handle chat request
app.post('/chat', upload.none(), async (req, res) => {
    const prompt = req.body.prompt;
    // Générer un nouvel ID de conversation si non fourni
    let conversationID;
    conversationID = req.body.conversationID ;
    if (conversationID == null || conversationID == "null" || conversationID == "undefined"  ){
        conversationID = uuidv4();
    }


    console.log("PROMPT: ", prompt);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [{ "role": "user", "content": prompt }],
            temperature: 1,
            max_tokens: 100,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const chatResponse = response.choices[0].message.content;

        try {
            const history = await readChatHistory();
            const conversation = history.find(conv => conv.conversationID === conversationID);
            if (conversation) {
                conversation.chats.push({ prompt, chatResponse });
            } else {
                history.push({ conversationID, chats: [{ prompt, chatResponse }] });
            }
            await writeChatHistory(history);
            res.json({ choices: response.choices, conversationID });
        } catch (error) {
            console.error("Failed to add to chat history:", error);
            res.status(500).json({ error: "Failed to add to chat history", details: error.message });
        }
    } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ error: "Error communicating with OpenAI API", details: error.message });
    }
});


app.post('/image', upload.none(), async (req, res) => {
    const prompt = req.body.prompt;
    let conversationID;
    conversationID = req.body.conversationID ;
    if (conversationID == null || conversationID == "null" || conversationID == "undefined"  ){
        conversationID = uuidv4();
    }

    console.log("IMAGE PROMPT: ", prompt);

    try {
        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            n: 1,
            size: "256x256",
        });

        const imageResponse = response.data[0].url;

        try {
            const history = await readChatHistory();
            const conversation = history.find(conv => conv.conversationID === conversationID);
            if (conversation) {
                conversation.chats.push({ prompt, imageResponse });
            } else {
                history.push({ conversationID, chats: [{ prompt, imageResponse }] });
            }
            await writeChatHistory(history);
            res.json({ url: imageResponse, conversationID });
        } catch (error) {
            console.error("Failed to add to chat history:", error);
            res.status(500).json({ error: "Failed to add to chat history", details: error.message });
        }
    } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ error: "Error communicating with OpenAI API", details: error.message });
    }
});


app.post('/speech', upload.none(), async (req, res) => {
    const prompt = req.body.prompt;
    try {
        // Appel à une fonction hypothétique qui envoie `prompt` à une API de synthèse vocale
        // et reçoit un fichier audio (ou un lien vers celui-ci) en réponse.
        const audioResponse = await synthesizeSpeech(prompt);

        // Envoyer le fichier audio ou le lien vers le fichier audio en réponse
        res.json(audioResponse);
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).json({ error: 'Error generating speech' });
    }
});

app.get('/conversations', async (req, res) => {
    try {
        const history = await readChatHistory();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read chat history' });
    }
});


app.get('/conversations/:id', async (req, res) => {
    const conversationID = req.params.id;
    try {
        const history = await readChatHistory();
        const conversation = history.find(conv => conv.conversationID === conversationID);
        if (conversation) {
            res.json(conversation);
        } else {
            res.status(404).json({ error: 'Conversation not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read chat history' });
    }
});

// start server and listen to port 3001
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});