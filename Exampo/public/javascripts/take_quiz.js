// Audio elements for sound effects
const timeUpSound = new Audio('/sounds/error-sound.mp3'); // Add your time-up sound file path here
const warning = new Audio('/sounds/beep-warning.mp3'); // Add your warning sound file path here

// Quiz state variables
let currentQuestion = 0;
let userAnswers = new Array(questions.length).fill(null);
let timer;
let timeLeft = totalDuration*60; // Use the total duration from the database

// Function to display current question
function showQuestion() {
    const timerElement = document.querySelector('.timer');
    timerElement.classList.remove('pulsing'); // Remove pulsing effect

    const question = questions[currentQuestion];
    document.querySelector('.question').textContent = `Question ${currentQuestion + 1}: ${question.questionText}`;

    // Generate option buttons
    const optionsContainer = document.querySelector('.options');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.dataset.index = index; // Store the index for easier retrieval
        if (userAnswers[currentQuestion] === option.text) {
            optionElement.classList.add('selected');
        }
        optionElement.textContent = option.text;
        optionElement.onclick = () => selectOption(option.text);
        optionsContainer.appendChild(optionElement);
    });

    // Update progress bar
    const progress = ((currentQuestion) / questions.length) * 100;
    document.querySelector('.progress-bar').style.width = `${progress}%`;

    // Update navigation buttons
    updateNavigationButtons();

    // Start timer for the entire quiz
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
    if (timer) clearInterval(timer);
    updateTimer();
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const timerElement = document.querySelector('.timer');

    // Calculate minutes and seconds
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Update the timer display in MM:SS format
    document.getElementById('time').textContent =
        `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; // Pad seconds with a leading zero if needed

    // Time's up
    if (timeLeft <= 0) {
        clearInterval(timer);
        timeUpSound.play();
        submitQuiz(); // Automatically submit when the total time is up
    }

    timeLeft--;
}


// Option selection handler
function selectOption(selectedText) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    
    // Find and select the option that matches the selected text
    options.forEach(option => {
        if (option.textContent === selectedText) {
            option.classList.add('selected');
        }
    });

    userAnswers[currentQuestion] = selectedText; // Save the text instead of the index

    // Update the hidden input field every time an option is selected
    document.getElementById('userAnswersInput').value = JSON.stringify(userAnswers);
    console.log('Updated userAnswers:', userAnswers); // Debugging log to check userAnswers
}

// Navigation functions
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
    }
}

// Quiz submission function
function submitQuiz() {
    clearInterval(timer);

    // Ensure the hidden input field is populated before submitting
    document.getElementById('userAnswersInput').value = JSON.stringify(userAnswers);

    // Check if the userAnswers array is correctly populated before submission
    if (!document.getElementById('userAnswersInput').value || document.getElementById('userAnswersInput').value === '[]') {
        console.error('Error: User answers are empty');
        alert('Please ensure all questions are answered before submitting.');
        return;
    }

    // Submit the form
    document.getElementById('submitForm').submit();
}

// Initialize quiz
showQuestion();
