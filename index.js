
window.onload = function() {
    loadTextFromFile();
}
async function loadTextFromFile() {
    const response = await fetch('source.txt');
    let text = await response.text();

    // Convert text to lowercase
    text = text.toLowerCase();

    // Remove citations
    text = text.replace(/\[\d+\]/g, '');

    const passageElement = document.getElementById('passage');
    passageElement.innerText = text;
}
async function findAnswers() {
    const statusElement = document.getElementById('status');

    statusElement.innerText = "Loading model...";
    const model = await qna.load();
    statusElement.innerText += "\nModel loaded.";

    const questionElement = document.getElementById('question');
    const passageElement = document.getElementById('passage');

    const question = questionElement.value;
    const passage = passageElement.innerText;

    statusElement.innerText += "\nFinding answers...";
    const answers = await model.findAnswers(question, passage);
    statusElement.innerText += "\nAnswers found.";

    let highlightedPassage = passage;
    answers.forEach(answer => {
        const answerText = answer.text;
        const highlightedAnswer = `<span class="highlight">${answerText}</span>`;
        highlightedPassage = highlightedPassage.replace(answerText, highlightedAnswer);
    });

    passageElement.innerHTML = highlightedPassage;

    if (answers.length > 0) {
        statusElement.innerText += `\nAnswer: ${answers[0].text}`;
    } else {
        statusElement.innerText += "\nNo answers found in the passage.";
    }
}