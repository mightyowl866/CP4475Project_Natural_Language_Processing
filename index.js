window.onload = function() {
    loadTextFromFile();
}
async function loadTextFromFile() {
    const response = await fetch('source.txt');
    const text = await response.text();

    const passageElement = document.getElementById('passage');
    passageElement.innerText = text;
}
async function findAnswers() {
    console.log("Loading model...");
    const model = await qna.load();
    console.log("Model loaded.");

    const questionElement = document.getElementById('question');
    const passageElement = document.getElementById('passage');

    const question = questionElement.value;
    const passage = passageElement.innerText;

    console.log("Finding answers...");
    const answers = await model.findAnswers(question, passage);
    console.log("Answers found.");

    let highlightedPassage = passage;
    answers.forEach(answer => {
        const answerText = answer.text;
        const highlightedAnswer = `<span class="highlight">${answerText}</span>`;
        highlightedPassage = highlightedPassage.replace(answerText, highlightedAnswer);
    });

    passageElement.innerHTML = highlightedPassage;

    if (answers.length > 0) {
        alert(`Answer: ${answers[0].text}`);
    } else {
        alert("No answers found in the passage.");
    }
}