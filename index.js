window.onload = function() {
    console.log("Window loaded");
    loadTextFromFile();
}

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

let useModel;
async function loadUseModel() {
    console.log("Loading Universal Sentence Encoder...");
    useModel = await use.load();
    console.log("Universal Sentence Encoder loaded.");
}
loadUseModel();

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

        // Display the top answers
        for (let i = 0; i < Math.min(answers.length, 3); i++) {
            let answerText = `Answer ${i+1}: ${answers[i].text} (Confidence Score: ${answers[i].score.toFixed(2)}, Similarity: ${answers[i].similarity.toFixed(2)})`;
            if (i === 0) { // The answer with the highest confidence score
                answerText = `<b>${answerText}</b>`;
            }
            statusElement.innerHTML += `\n${answerText}`;
            console.log(answerText);
        }
    } else {
        statusElement.innerText += "\nNo answers found in the passage.";
        console.log("No answers found in the passage");
    }
}