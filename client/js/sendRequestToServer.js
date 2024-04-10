import { getImageFromDallE } from './dallE.js';

const endpointURL = 'http://localhost:3001/chat';

let outputElement, submitButton, inputElement, historyElement, titre, inputChatElement, imageOutputElement;

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
    submitButton.addEventListener('click', getResponseFromServer);

    // Gestionnaire pour la touche Entrée
    inputElement.addEventListener('keyup', (event) => {
        // Vérifier si la touche pressée est "Entrée"
        if (event.key === "Enter") {
            getResponseFromServer(inputElement.value);
        }
    });
}

async function getResponseFromServer() {
    titre.style.display='none';
    const loaderModal = document.querySelector('#loaderModal');
    // Affichez la modale
    loaderModal.style.display = 'block';
    const prompt = inputElement.value.trim().toLowerCase();
try{
    if (prompt.startsWith('/image')) {
        // Handle image generation
        await handleImageCommand(prompt);
    } else {
        // Handle regular chat response
        await handleChatResponse(prompt);
    }

    // Clear input after handling
    clearInput();
}catch(error){
    console.log(error);
}finally{
    loaderModal.style.display='none';
}
}

async function handleImageCommand(prompt) {
    let images = await getImageFromDallE(prompt.slice(7)); // Enlevez '/image '
    console.log(images);

    images.data.forEach(imageObj => {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        // Création et ajout du prompt de l'utilisateur
        const userPromptElement = document.createElement('p');
        userPromptElement.textContent = "Vous : " + prompt;
        userPromptElement.classList.add('user-prompt');
        imageContainer.appendChild(userPromptElement);

        const imgElement = document.createElement('img');
        imgElement.src = imageObj.url; // Vérifiez que c'est la propriété correcte
        imgElement.width = 256;
        imgElement.height = 256;

        imageContainer.appendChild(imgElement);
        imageOutputElement.appendChild(imageContainer); // Utilisez le conteneur d'images ici
        // Ajout de l'interaction complète au conteneur principal
        inputChatElement.appendChild(imageContainer);

        // S'assurer que l'affichage défile vers le bas pour montrer la dernière interaction
        inputChatElement.scrollTop = inputChatElement.scrollHeight;
    });
}


async function handleChatResponse(prompt) {
    // Similar to your current implementation of getResponseFromServer
    // But this function is specifically for handling text responses from GPT-3
    const promptData = new FormData();
    promptData.append('prompt', prompt);

    const response = await fetch(endpointURL, {
        method: 'POST',
        body: promptData
    });

    // Traitement de la réponse JSON
    const data = await response.json();
    console.log(data);

    // Extraction du texte de réponse
    const chatGptReponseTxt = data.choices[0].message.content;

    // Création d'un conteneur pour l'interaction prompt-réponse
    const interactionContainer = document.createElement('div');
    interactionContainer.classList.add('interaction-container');

    // Création et ajout du prompt de l'utilisateur
    const userPromptElement = document.createElement('p');
    userPromptElement.textContent = "Vous : " + prompt;
    userPromptElement.classList.add('user-prompt');
    interactionContainer.appendChild(userPromptElement);

    // Création et ajout de la réponse de ChatGPT
    const gptResponseElement = document.createElement('p');
    gptResponseElement.textContent = chatGptReponseTxt;
    gptResponseElement.classList.add('gpt-response');
    interactionContainer.appendChild(gptResponseElement);

    // Ajout de l'interaction complète au conteneur principal
    inputChatElement.appendChild(interactionContainer);

    // S'assurer que l'affichage défile vers le bas pour montrer la dernière interaction
    inputChatElement.scrollTop = inputChatElement.scrollHeight;

    // Effacer l'input après l'envoi
    clearInput();

    // Ajout dans l'historique sur la gauche
    if (data.choices[0].message.content) {
        const pElement = document.createElement('p');
        pElement.textContent = inputElement.value;
        pElement.onclick = () => {
            inputElement.value = pElement.textContent;
        };
        historyElement.append(pElement);
    }
}

function clearInput() {
    inputElement.value = '';
}


