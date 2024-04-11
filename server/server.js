// generate minimal server for api with express
import express from 'express';
import { API_KEY } from './config.js';
import OpenAI from "openai";
// handle form data posted
import multer from 'multer';
import { readChatHistory, addToChatHistory } from './chatHistory.js';



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

// handle post request to /chat, and use multer to get the form data
app.post('/chat', upload.none(), async (req, res) => {
    // get prompt from the form data
    const prompt = req.body.prompt;
    console.log("PROMPT: ", prompt);
    
    // send the prompt to the OpenAI API
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            "role": "user",
            "content": prompt
          }
        ],
        temperature: 1,
        max_tokens: 50,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    const chatResponse = response.choices[0].message.content;

    // Enregistrez chaque interaction dans l'historique
    await addToChatHistory({ prompt, chatResponse });

    res.json(response);
});

app.post('/image', upload.none(), async (req, res) => {
  // get prompt from the form data
  const prompt = req.body.prompt;
  console.log("IMAGE PROMPT: ", prompt);
  
  // send the prompt to the OpenAI Dall-E 2 API
  const response = await openai.images.generate({
    model: "dall-e-2",
    prompt: prompt,
    n: 1, // nombre de variations
    size: "256x256",
  });

  // send the response as json
  res.json(response);
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


// start server and listen to port 3001
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});