import { getImageFromDallE } from './dallE.js';

const endpointURL = 'http://localhost:3001/chat';

let outputElement, submitButton, inputElement, historyElement, titre, inputChatElement, imageOutputElement, conversationID = null;

window.onload = init;

function init() {
    outputElement = document.querySelector('#output');
    submitButton = document.querySelector('#submit');
    imageOutputElement = document.querySelector('#imageOutput'); // Nouvelle sélection
    inputElement = document.querySelector('input');
    historyElement = document.querySelector('.history');
    inputChatElement = document.querySelector('#inputChat');
    titre = document.querySelector('.titre');



    // Attach event listener
    submitButton.addEventListener('click', function (event) {
        getResponseFromServer();
    });

    // Gestionnaire pour la touche Entrée
    inputElement.addEventListener('keyup', (event) => {
        // Vérifier si la touche pressée est "Entrée"
        if (event.key === "Enter") {
            getResponseFromServer(inputElement.value);
        }
    });

    const newChatButton = document.querySelector('.side-bar button');
    if (newChatButton) {
        newChatButton.addEventListener('click', startNewChat);
    }

    fetchConversations();
}


document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('recordButton');
    const sendButton = document.getElementById('sendButton');

    if (recordButton) {
        recordButton.addEventListener('click', getResponseFromServer);
    }
    if (sendButton) {
        sendButton.addEventListener('click', () => getResponseFromServer('/send'));
    }
});
var isRecording = false;
var mediaRecorder;
var audioChunks = [];

async function getResponseFromServer() {
    const prompt = inputElement.value.trim().toLowerCase();
    const loaderModal = document.querySelector('#loaderModal');
    loaderModal.style.display = 'flex';

    try {
        if (prompt.startsWith('/image')) {
            // Handle image generation
            await handleImageCommand(prompt);
            clearInput();
            loaderModal.style.display = 'none';


        } else if (prompt === '/record') {
            // Toggle audio recording
            if (!isRecording) {
                startRecording();
                loaderModal.style.display = 'none';

            } else {
                stopRecording();

            }
        }else {
            // Handle regular chat response
            await handleChatResponse(prompt);
            clearInput();
            loaderModal.style.display = 'none';

        }
    } catch (error) {
        console.log(error);
    } 
    fetchConversations();
}


let recognition;
let finalTranscript = '';

function startRecording() {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Capture continuellement l'audio
        recognition.lang = 'fr-FR'; // Définir la langue appropriée

        recognition.onstart = function () {
            console.log("Voice recognition started. Speak into the microphone.");
        };

        recognition.onresult = function (event) {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            console.log('Interim transcript: ', interimTranscript);
            console.log('Final transcript: ', finalTranscript);
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error', event.error);
        };

        recognition.onend = function () {
            console.log("Voice recognition stopped.");
            sendRecordedAudio(finalTranscript);
            finalTranscript = '';
        };
        document.getElementById("recordButton").innerHTML="Envoyer ➢"
        recognition.start();
        isRecording = true;
    } else {
        console.error('Your browser does not support Speech Recognition.');
    }
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        const loaderModal = document.querySelector('#loaderModal');
        loaderModal.style.display = 'flex';
        document.getElementById("recordButton").innerHTML="🎤 Record"

    }
}


 async function sendRecordedAudio(text) {
    const loaderModal = document.querySelector('#loaderModal');
   
    const promptData = new FormData();
    promptData.append('prompt', text);
    promptData.append('conversationID', conversationID);
    const response = await fetch(endpointURL, {
        method: 'POST',
        body: promptData
    });

    // Vous devez attendre que la promesse soit résolue
    const data = await response.json(); // Ajoutez 'await' ici
    console.log(data);

    // Assurez-vous que la structure de la réponse correspond à ce que vous attendez
    if (data.choices && data.choices.length > 0) {
        const chatGptReponseTxt = data.choices[0].message.content;

        // Logique pour ajouter la réponse à l'interface utilisateur
        const interactionContainer = document.createElement('div');
        interactionContainer.classList.add('interaction-container');

        const userPromptElement = document.createElement('p');
        userPromptElement.textContent = "Vous /record : " + text;
        userPromptElement.classList.add('user-prompt');
        interactionContainer.appendChild(userPromptElement);

        const gptResponseElement = document.createElement('p');
        gptResponseElement.textContent = chatGptReponseTxt;
        gptResponseElement.classList.add('gpt-response');
        interactionContainer.appendChild(gptResponseElement);

        inputChatElement.appendChild(interactionContainer);
        inputChatElement.scrollTop = inputChatElement.scrollHeight;
    }
    titre.style.display='none';
    loaderModal.style.display = 'none';
    document.getElementById('recordDiv').style.display='none';
    clearInput();
}

async function handleImageCommand(prompt) {
    let images = await getImageFromDallE(prompt.slice(7), conversationID);
    console.log(images);


   
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        // Création et ajout du prompt de l'utilisateur
        const userPromptElement = document.createElement('p');
        userPromptElement.textContent = "Vous : " + prompt;
        userPromptElement.classList.add('user-prompt');
        imageContainer.appendChild(userPromptElement);

        const imgElement = document.createElement('img');
        imgElement.src = images.url; // Vérifiez que c'est la propriété correcte
        imgElement.width = 256;
        imgElement.height = 256;

        imageContainer.appendChild(imgElement);
        imageOutputElement.appendChild(imageContainer); // Utilisez le conteneur d'images ici
        // Ajout de l'interaction complète au conteneur principal
        inputChatElement.appendChild(imageContainer);

        // S'assurer que l'affichage défile vers le bas pour montrer la dernière interaction
        inputChatElement.scrollTop = inputChatElement.scrollHeight;
        titre.style.display='none';
    
}


document.getElementById('userInput').addEventListener('input', function () {
    const userInput = document.getElementById('userInput').value.toLowerCase();
    const imageOptionsContainer = document.getElementById('imageOptions');
    if (userInput.startsWith('/image')) {
        imageOptionsContainer.style.display = 'block';
    } else if (userInput.startsWith('/record')) {
        document.getElementById('recordDiv').style.display='block';
    }
    else {
        imageOptionsContainer.style.display = 'none';
    }

});

// Attacher des écouteurs d'événements aux éléments select
document.getElementById('imageType').addEventListener('change', function () {
    handleInputChanges();
});

document.getElementById('timeOfDay').addEventListener('change', function () {
    handleInputChanges();
});


function handleInputChanges() {
    const userInput = document.getElementById('userInput').value.toLowerCase();
    const imageOptionsContainer = document.getElementById('imageOptions');
    if (userInput.startsWith('/image')) {
        imageOptionsContainer.style.display = 'block';
    } else {
        imageOptionsContainer.style.display = 'none';

    }
    updatePrompt();  // Met à jour l'affichage du prompt
}

function updatePrompt() {
    // Récupérer le texte initial entré par l'utilisateur jusqu'au premier ','
    // Cela suppose que la base du prompt ne contient pas de ',' ajouté par l'utilisateur autrement qu'en tant que séparateur pour les options.
    let userInput = document.getElementById('userInput').value;
    let basePromptIndex = userInput.indexOf(',');
    let basePrompt = basePromptIndex > -1 ? userInput.substring(0, basePromptIndex) : userInput.trim();

    const imageType = document.getElementById('imageType').value;
    const timeOfDay = document.getElementById('timeOfDay').value;

    // Construire le fullPrompt en partant de basePrompt
    let fullPrompt = basePrompt;

    // Ajouter les conditions seulement si elles sont sélectionnées
    if (imageType) {
        fullPrompt += ", " + imageType;
    }
    if (timeOfDay) {
        fullPrompt += ", " + timeOfDay + ",";
    }

    // Mettre à jour l'input pour refléter le prompt complet
    document.getElementById('userInput').value = fullPrompt;
    console.log("Updated prompt: ", fullPrompt);
    return fullPrompt;
}



async function handleChatResponse(prompt) {
    const promptData = new FormData();
    promptData.append('prompt', prompt);
    promptData.append('conversationID', conversationID);

    try {
        const response = await fetch(endpointURL, {
            method: 'POST',
            body: promptData
        });

        // Vous devez attendre que la promesse soit résolue
        const data = await response.json(); // Ajoutez 'await' ici
        console.log(data);

        // Assurez-vous que la structure de la réponse correspond à ce que vous attendez
        if (data.choices && data.choices.length > 0) {
            const chatGptReponseTxt = data.choices[0].message.content;
            conversationID = data.conversationID;
            // Logique pour ajouter la réponse à l'interface utilisateur
            const interactionContainer = document.createElement('div');
            interactionContainer.classList.add('interaction-container');

            const userPromptElement = document.createElement('p');
            userPromptElement.textContent = "Vous : " + prompt;
            userPromptElement.classList.add('user-prompt');
            interactionContainer.appendChild(userPromptElement);

            const gptResponseElement = document.createElement('p');
            gptResponseElement.textContent = chatGptReponseTxt;
            gptResponseElement.classList.add('gpt-response');
            interactionContainer.appendChild(gptResponseElement);

            inputChatElement.appendChild(interactionContainer);
            inputChatElement.scrollTop = inputChatElement.scrollHeight;
            titre.style.display='none';
        }
    } catch (error) {
        console.error('Failed to handle chat response:', error);
    }
}


function clearInput() {
    // Nettoyer le champ d'input principal
    inputElement.value = '';
    document.getElementById('userInput').value = '';

    // Réinitialiser les sélections des menus déroulants
    document.getElementById('imageType').value = '';
    document.getElementById('timeOfDay').value = '';

    // Masquer le conteneur des options d'image
    const imageOptionsContainer = document.getElementById('imageOptions');
    imageOptionsContainer.style.display = 'none';
}


async function startNewChat() {
    try {
        const response = await fetch('http://localhost:3001/new-chat', {
            method: 'POST'
        });
        const data = await response.json();
        conversationID = data.conversationID;
        inputChatElement.innerHTML = ''; // Clear chat history in UI
    } catch (error) {
        console.error('Failed to start a new chat:', error);
    }
}


async function fetchConversations() {
    try {
        const response = await fetch('http://localhost:3001/conversations');
        const data = await response.json();
        displayConversations(data);
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
    }
}

function displayConversations(conversations) {
    const historyElement = document.querySelector('.history');
    historyElement.innerHTML = ''; // Clear previous conversations

    conversations.forEach(conversation => {
        const firstPrompt = conversation.chats[0]?.prompt || 'Untitled';
        const conversationElement = document.createElement('div');
        conversationElement.classList.add('conversation-item');
        conversationElement.textContent = firstPrompt;

        conversationElement.addEventListener('click', () => {
            loadConversation(conversation.conversationID);
            conversationID=conversation.conversationID;
        });

        historyElement.appendChild(conversationElement);
    });
}

async function loadConversation(conversationID) {
    try {
        const response = await fetch(`http://localhost:3001/conversations/${conversationID}`);
        const data = await response.json();
        displayConversation(data);
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
}
function displayConversation(conversation) {
    inputChatElement.innerHTML = ''; // Clear previous chat messages

    conversation.chats.forEach(chat => {
        const interactionContainer = document.createElement('div');
        interactionContainer.classList.add('interaction-container');

        const userPromptElement = document.createElement('p');
        userPromptElement.textContent = "Vous : " + chat.prompt;
        userPromptElement.classList.add('user-prompt');
        interactionContainer.appendChild(userPromptElement);

        if (chat.chatResponse) {
            const gptResponseElement = document.createElement('p');
            gptResponseElement.textContent = chat.chatResponse;
            gptResponseElement.classList.add('gpt-response');
            interactionContainer.appendChild(gptResponseElement);
        } else if (chat.imageResponse) {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('image-container');

            const imgElement = document.createElement('img');
            imgElement.src = chat.imageResponse; // Assurez-vous que c'est la bonne propriété
            imgElement.width = 256;
            imgElement.height = 256;

            imageContainer.appendChild(imgElement);
            interactionContainer.appendChild(imageContainer);
        }

        inputChatElement.appendChild(interactionContainer);
    });

    inputChatElement.scrollTop = inputChatElement.scrollHeight;
    titre.style.display = 'none';
}
