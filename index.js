// This function is called when the window is loaded. It logs a message to the console and calls the loadTextFromFile function.
window.onload = function() {
    console.log("Window loaded");
    loadTextFromFile();
}

// This function loads text from a file named 'source.txt', converts the text to lowercase, removes citations, and sets the text of an element with the id 'passage' to the loaded text.
async function loadTextFromFile() {
    console.log("Loading text from file...");
    const response = await fetch('source.txt');
    let text = await response.text();

    // Convert text to lowercase
    text = text.toLowerCase();

    // Remove citations
    text = text.replace(/\[\d+\]/g, '');

    const passageElement = document.getElementById('passage');
    passageElement.innerText = text;
    console.log("Text loaded from file");
}

// This function loads the Universal Sentence Encoder model and assigns it to the useModel variable.
let useModel;
async function loadUseModel() {
    console.log("Loading Universal Sentence Encoder...");
    useModel = await use.load();
    console.log("Universal Sentence Encoder loaded.");
}
loadUseModel();

// This function finds answers to a question in a passage. It loads a model, gets the question and passage from elements with the ids 'question' and 'passage', finds answers to the question in the passage, highlights the answers in the passage, generates embeddings for the question and each answer, computes the semantic similarity between the question and each answer, sorts the answers by similarity in descending order, and displays the top answers.
async function findAnswers() {
    const statusElement = document.getElementById('status');

    statusElement.innerText = "Loading model...";
    console.log("Loading model...");
    const model = await qna.load();
    statusElement.innerText += "\nModel loaded.";
    console.log("Model loaded");

    const questionElement = document.getElementById('question');
    const passageElement = document.getElementById('passage');

    const question = questionElement.value;
    const passage = passageElement.innerText;

    statusElement.innerText += "\nFinding answers...";
    console.log("Finding answers...");
    const answers = await model.findAnswers(question, passage);
    statusElement.innerText += "\nAnswers found.";
    console.log("Answers found");

    let highlightedPassage = passage;
    answers.forEach(answer => {
        const answerText = answer.text;
        const highlightedAnswer = `<span class="highlight">${answerText}</span>`;
        highlightedPassage = highlightedPassage.replace(answerText, highlightedAnswer);
    });

    passageElement.innerHTML = highlightedPassage;

    if (answers.length > 0) {
        // Generate embeddings for the question and each answer
        const questionEmbedding = await useModel.embed([question]);
        const answerEmbeddings = await Promise.all(answers.map(answer => useModel.embed([answer.text])));

        // Compute the semantic similarity between the question and each answer
        const similarities = await Promise.all(answerEmbeddings.map(answerEmbedding => 
            questionEmbedding.dot(answerEmbedding.transpose())));

        // Add the similarity to each answer
        answers.forEach((answer, i) => {
            answer.similarity = similarities[i].dataSync()[0];
        });

        // Sort the answers by similarity in descending order
        answers.sort((a, b) => b.similarity - a.similarity);

        // Create a table
        let table = `<table><tr><th>Answer</th><th>Confidence Score</th><th>Similarity</th></tr>`;

        // Display the top answers
        for (let i = 0; i < Math.min(answers.length, 3); i++) {
            let answerText = answers[i].text;
            let confidenceScore = answers[i].score.toFixed(2);
            let similarity = answers[i].similarity.toFixed(2);

            // Add a row to the table for each answer
            table += `<tr><td>${answerText}</td><td>${confidenceScore}</td><td>${similarity}</td></tr>`;
        }

        // Close the table
        table += `</table>`;

        // Add the table to the status element
        statusElement.innerHTML += table;
        } else {
            statusElement.innerText += "\nNo answers found in the passage.";
            console.log("No answers found in the passage");
        }
}