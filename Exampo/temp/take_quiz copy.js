 // Audio elements for sound effects
 const timeUpSound = new Audio('/sounds/error-sound.mp3'); // Add your time-up sound file path here
 const warning = new Audio('/sounds/beep-warning.mp3'); // Add your correct answer sound file path here

 // Quiz questions array
 const questions = [
     {
         question: "What is the capital of France?",
         options: ["London", "Berlin", "Paris", "Madrid"],
         correct: 2,
         timeLimit: 30
     },
     {
         question: "Which planet is known as the Red Planet?",
         options: ["Venus", "Mars", "Jupiter", "Saturn"],
         correct: 1,
         timeLimit: 20
     },
     {
         question: "What is 2 + 2 × 2?",
         options: ["6", "8", "4", "10"],
         correct: 0,
         timeLimit: 15
     }
 ];

 // Quiz state variables
 let currentQuestion = 0;
 let userAnswers = new Array(questions.length).fill(null);
 let timer;
 let timeLeft;

 // Function to display current question
 function showQuestion() {
     const timerElement = document.querySelector('.timer');
timerElement.classList.remove('pulsing'); // Remove pulsing effect
const question = questions[currentQuestion];
document.querySelector('.question').textContent = `Question ${currentQuestion + 1}: ${question.question}`;

// Generate option buttons
const optionsContainer = document.querySelector('.options');
optionsContainer.innerHTML = '';

question.options.forEach((option, index) => {
 const optionElement = document.createElement('div');
 optionElement.className = 'option';
 if (userAnswers[currentQuestion] === index) {
     optionElement.classList.add('selected');
 }
 optionElement.textContent = option;
 optionElement.onclick = () => selectOption(index);
 optionsContainer.appendChild(optionElement);
});

// Update progress bar
const progress = ((currentQuestion) / questions.length) * 100;
document.querySelector('.progress-bar').style.width = `${progress}%`;

// Update navigation buttons
updateNavigationButtons();

// Start timer for current question
startTimer();
}


// Function to update navigation buttons state
function updateNavigationButtons() {
    // Show the Next button only if it's not the last question
    document.getElementById('next-btn').style.display = 
        currentQuestion < questions.length - 1 ? 'block' : 'none';

    // Show the Submit button only on the last question
    document.getElementById('submit-btn').style.display = 
        currentQuestion === questions.length - 1 ? 'block' : 'none';
}

 // Timer functions
 function startTimer() {
     timeLeft = questions[currentQuestion].timeLimit;
     updateTimer();
     if (timer) clearInterval(timer);
     timer = setInterval(updateTimer, 1000);
 }

function updateTimer() {
    const timerElement = document.querySelector('.timer');
    document.getElementById('time').textContent = timeLeft;

    // Start pulsing effect at 5 seconds remaining
    if (timeLeft === 5) {
    warning.play();
    timerElement.classList.add('pulsing');
    }

    // Time's up
    if (timeLeft === 0) {
    clearInterval(timer);
    timeUpSound.play();
    timerElement.classList.remove('pulsing'); // Remove pulsing when time is up

    // Check if it's the last question
    if (currentQuestion === questions.length - 1) {
        submitQuiz(); // Automatically submit if on last question
    } else {
        nextQuestion(); // Go to the next question if not the last one
    }
    }

    timeLeft--;
}

 // Option selection handler
 function selectOption(index) {
     const options = document.querySelectorAll('.option');
     options.forEach(option => option.classList.remove('selected'));
     options[index].classList.add('selected');
     userAnswers[currentQuestion] = index;
 }

 // Navigation functions
 /*function previousQuestion() {  // deeeeeeeeeeeeeeeeeeeeeellllleeeeeeeeeeete
     if (currentQuestion > 0) {
         currentQuestion--;
         showQuestion();
     }
 } */

// Navigation functions
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
    }
}

 // Quiz submission and results
 function submitQuiz() {
     clearInterval(timer);
     showResults();
 }

 function showResults() {
     // Hide quiz interface
     document.querySelector('.question-container').style.display = 'none';
     document.querySelector('.timer').style.display = 'none';
     document.querySelector('.results').style.display = 'block';

     // Calculate and display score
     const score = calculateScore();
     displayScore(score);

     // Show detailed review
     showDetailedReview();
 }

 function calculateScore() {
     return userAnswers.reduce((total, answer, index) => 
         total + (answer === questions[index].correct ? 1 : 0), 0);
 }

 function displayScore(score) {
     document.querySelector('.score').textContent = 
         `Quiz Complete! Your Score: ${score}/${questions.length}`;
 }

 function showDetailedReview() {
     const reviewContainer = document.querySelector('.review-container');
     reviewContainer.innerHTML = '<h3>Review Your Answers:</h3>';

     questions.forEach((question, index) => {
         const userAnswer = userAnswers[index];
         const isCorrect = userAnswer === question.correct;
         
         const reviewQuestion = document.createElement('div');
         reviewQuestion.className = 'review-question';
         reviewQuestion.innerHTML = `
             <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
             <p style="color: ${isCorrect ? '#4caf50' : '#f44336'}">
                 Your answer: ${userAnswer !== null ? question.options[userAnswer] : 'Not answered'}
                 ${isCorrect ? '✓' : '✗'}
             </p>
             ${!isCorrect ? `<p style="color: #4caf50">Correct answer: ${question.options[question.correct]}</p>` : ''}
         `;
         reviewContainer.appendChild(reviewQuestion);
     });
 }

 // Reset quiz function
 function restartQuiz() {
     currentQuestion = 0;
     userAnswers = new Array(questions.length).fill(null);
     document.querySelector('.question-container').style.display = 'block';
     document.querySelector('.timer').style.display = 'block';
     document.querySelector('.results').style.display = 'none';
     showQuestion();
 }

 // Initialize quiz
 showQuestion();