document.addEventListener('DOMContentLoaded', () => {
    let score = 0;
    let timerInterval;
    let questions = {};
    let categories = [];

    // Event listener for the load button
    document.getElementById('load-button').addEventListener('click', () => {
        const selectedTopic = document.getElementById('topic').value;
        let jsonURL;

        // Determine which URL to load based on the selected topic
        switch (selectedTopic) {
            case 'programming':
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/programming.json';
                break;
            case 'animals':
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/animals.json';
                break;
            case 'biology':
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/biology.json';
                break;
            case 'user_design':
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/user_design.json';
                break;
            case 'basic_it':
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/basic_it.json';
                break;
            case 'sql_developer':
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/sql_developer.json';
                break;
            default:
                jsonURL = 'https://weaponxd253.github.io/JeopardyApi/categories.json';
        }

        // Fetch the appropriate JSON file from the URL
        fetch(jsonURL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                categories = data.categories;
                questions = data.questions;
                createCategories(categories);
                resetGame();
            })
            .catch(error => console.error('Error fetching data:', error));
    });

    function createCategories(categories) {
        const jeopardyBoard = document.querySelector('.jeopardy-board');
        jeopardyBoard.innerHTML = ''; // Clear existing content

        const categoryElements = categories.map(category => {
            const div = document.createElement('div');
            div.className = 'category';
            div.id = `category${category.id}`;
            div.textContent = category.name;
            return div;
        });

        // Add the categories to the board
        categoryElements.forEach(categoryElement => jeopardyBoard.appendChild(categoryElement));

        // Add the questions under each category
        for (let i = 1; i <= 5; i++) { // Assuming 5 questions per category
            const questionsRow = document.createElement('div');
            questionsRow.className = 'questions';

            categories.forEach(category => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question';
                questionDiv.dataset.category = category.id;
                questionDiv.dataset.value = i * 100; // Assuming values are 100, 200, ..., 500
                questionDiv.textContent = i * 100;
                questionsRow.appendChild(questionDiv);
            });

            jeopardyBoard.appendChild(questionsRow);
        }

        // Add event listeners to the questions
        document.querySelectorAll('.question').forEach(item => {
            item.addEventListener('click', handleQuestionClick);
        });
    }

    function handleQuestionClick(event) {
        clearInterval(timerInterval); // Clear any existing timer
        const category = event.target.getAttribute('data-category');
        const value = event.target.getAttribute('data-value');
        const question = questions[category]?.[value]?.question;

        if (question) {
            document.getElementById('question-text').innerText = question;
            gsap.to("#modal", { display: 'flex', duration: 0 });
            gsap.to(".modal-content", { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });
            document.querySelector('.close-button').style.display = 'none'; // Hide the close button
            startTimer(30, category, value, event.target);

            const submitButton = document.getElementById('submit-answer');
            submitButton.onclick = () => {
                submitAnswer(category, value, event.target);
            };
        } else {
            console.error('Question not found for category:', category, 'value:', value);
        }
    }

    document.getElementById('reset-button').onclick = () => {
        resetGame();
    };

    function resetGame() {
        score = 0;
        document.getElementById('score').innerText = score;
        document.querySelectorAll('.question').forEach(item => {
            item.style.backgroundColor = '#343a40';
            item.style.pointerEvents = 'auto'; // Enable clicking again
        });
        gsap.to(".question", { opacity: 0, duration: 0 });
        gsap.to(".question", { opacity: 1, duration: 1, stagger: 0.1 });
    }

    function startTimer(seconds, category, value, questionElement) {
        let timeLeft = seconds;
        document.getElementById('time-left').innerText = timeLeft;
        timerInterval = setInterval(() => {
            timeLeft -= 1;
            document.getElementById('time-left').innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                submitAnswer(category, value, questionElement, true); // Automatically submit the answer when time is up
            }
        }, 1000);
    }

    function submitAnswer(category, value, questionElement = null, timeUp = false) {
        clearInterval(timerInterval);
        const userAnswer = document.getElementById('answer').value.trim().toLowerCase(); // Convert to lowercase

        if (!category || !value) {
            console.error('Question data not found for category:', category, 'value:', value);
            return;
        }

        const questionData = questions[category]?.[value];

        if (!questionData) {
            console.error('Question data not found for category:', category, 'value:', value);
            return;
        }

        const acceptableAnswers = questionData.answers;
        const explanation = questionData.explanation;

        let isCorrect = false;
        if (!timeUp) {
            isCorrect = acceptableAnswers.some(answer => userAnswer === answer.toLowerCase());
        }

        const resultClass = isCorrect ? 'correct-answer' : 'incorrect-answer';
        const resultText = isCorrect ? 'Correct!' : `Incorrect. The correct answers include: ${acceptableAnswers.join(', ')}`;

        const resultElement = document.createElement('div');
        resultElement.className = resultClass;
        resultElement.innerHTML = `<p>${resultText}</p><p>${explanation}</p>`;
        document.querySelector('.modal-content').appendChild(resultElement);

        if (isCorrect) {
            score += parseInt(value);
        } else if (!timeUp) {
            score -= parseInt(value);
        }

        let closeTimeLeft = 5; // Time to display the result before closing the modal
        document.getElementById('time-left').innerText = closeTimeLeft;

        const closeTimerInterval = setInterval(() => {
            closeTimeLeft -= 1;
            document.getElementById('time-left').innerText = closeTimeLeft;
            if (closeTimeLeft <= 0) {
                clearInterval(closeTimerInterval);
                gsap.to(resultElement, { opacity: 0, duration: 0.5, onComplete: () => {
                    document.querySelector('.modal-content').removeChild(resultElement);
                    gsap.to(".modal-content", { opacity: 0, scale: 0.8, duration: 0.5, onComplete: () => {
                        document.getElementById('modal').style.display = 'none';
                        document.querySelector('.close-button').style.display = 'block'; // Show the close button again
                    }});
                    if (questionElement) {
                        questionElement.style.backgroundColor = 'gray';
                        questionElement.style.pointerEvents = 'none'; // Disable clicking on this question again
                    }
                    document.getElementById('score').innerText = score;
                }});
            }
        }, 1000);
    }
});
