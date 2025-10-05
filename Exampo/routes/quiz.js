const express = require("express");
const router = express.Router({ mergeParams: true });
const Quiz = require('../models/Quiz');  // Quiz model
const Question = require('../models/Question');  // Question model
const Review = require('../models/Review'); 
const Answer = require('../models/Answer');
const { isLoggedIn } = require("../middlewares")


// Route to get all quizzes with pagination
router.get("/", async (req, res) => {
    const perPage = 16;  
    const page = parseInt(req.query.page) || 1;  

    try {
        const totalQuizzes = await Quiz.countDocuments();
        const quizzes = await Quiz.find()
            .populate({
                path: 'owner',
                select: 'username'  
            })
            .skip((perPage * page) - perPage)  
            .limit(perPage);  

        
        for (const quiz of quizzes) {
            quiz.averageRating = await quiz.calculateAverageRating();  
        }

        const totalPages = Math.ceil(totalQuizzes / perPage);

        res.render("quizzes/all_quizzes", {
            quizzes,
            currentPage: page,
            totalPages
        });
    } catch (err) {
        console.error("Error fetching quizzes:", err);
        res.status(500).send("Server error");
    }
});


router.get("/new", isLoggedIn, (req,res) => {
    res.render("quizzes/create_quiz")
})

// Route to get all quizzes owned by the logged-in user with pagination
router.get("/my", isLoggedIn, async (req, res) => {
    const perPage = 16;  // 16 quizzes per page (4 rows of 4)
    const page = parseInt(req.query.page) || 1;  // Current page (default to 1)
    const userId = req.user._id;  // Get the currently logged-in user's ID

    try {
        // Fetch total number of quizzes owned by the logged-in user
        const totalQuizzes = await Quiz.countDocuments({ owner: userId });

        // Fetch quizzes for the current page, owned by the logged-in user
        const quizzes = await Quiz.find({ owner: userId })
            .populate('owner')  // Populate owner data
            .skip((perPage * page) - perPage)  // Skip quizzes based on the current page
            .limit(perPage);  // Limit number of quizzes to the perPage value

        // Calculate average rating for each quiz
        for (const quiz of quizzes) {
            quiz.averageRating = await quiz.calculateAverageRating();  // Calculate average rating and store it in the quiz object
        }

        // Calculate total number of pages
        const totalPages = Math.ceil(totalQuizzes / perPage);

        // Render the "my_quizziz.ejs" template and pass the data
        res.render("quizzes/my_quizzes", {
            quizzes,
            currentPage: page,
            totalPages
        });
    } catch (err) {
        console.error("Error fetching user's quizzes:", err);
        res.status(500).send("Server error");
    }
});


// Route to get all quizzes owned by the logged-in user with pagination
// Fetch quiz details by ID and render the details page
router.get("/:id", async (req, res) => {
    try {
        const quizId = req.params.id;

        const quiz = await Quiz.findById(quizId)
            .populate({
                path: 'owner',  // Populate the owner of the quiz
                select: 'username'  // Only fetch the username of the owner
            })
            .populate({
                path: 'reviews',
                populate: {
                    path: 'user',  // Populate the user details for each review
                    select: 'username'  // Only fetch the username field from the user
                }
            });

        if (!quiz) {
            req.flash('error', 'Quiz not found');
            return res.redirect('/quizzes');
        }

        const answerCount = await Answer.countDocuments({ quiz: quizId });
        // Render the quiz details page and pass the quiz data
        res.render("quizzes/details", { quiz, answerCount });
    } catch (err) {
        console.error("Error fetching quiz details:", err);
        req.flash('error', 'Error fetching quiz details');
        return res.redirect('/quizzes');
    }
});


// GET route to render the edit quiz page
router.get('/:id/edit', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('owner').populate('questions');
        if (!quiz) {
            req.flash('error', 'Quiz not found');
            return res.redirect('/quizzes');
        }
        res.render('quizzes/edit_quiz', { quiz });
    } catch (err) {
        console.error("Error fetching quiz for editing:", err);
        req.flash('error', 'An error occurred while trying to fetch the quiz');
        res.redirect('/quizzes');
    }
});

// Route to render the "take quiz" page
router.get('/:id/take', isLoggedIn, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('questions');
        if (!quiz) return res.status(404).send('Quiz not found');
        
        res.render('quizzes/take_quiz', { quiz });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.get('/:quizId/results/:attemptId', isLoggedIn, async (req, res) => {
    try {
        const attempt = await Answer.findById(req.params.attemptId)
            .populate('quiz')
            .populate('answers.question');
        
        if (!attempt) return res.status(404).send('Attempt not found');

        res.render('quizzes/results', { attempt });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});



// POST route to create a new quiz
router.post('/create', isLoggedIn, async (req, res) => {
    const { title, questions, 'quiz-category': category, 'quiz-time': time } = req.body;
    const userId = req.user._id; // Get the current user's ID

    try {
        // Save each question
        const savedQuestions = await Promise.all(questions.map(async (question) => {
            const options = question.options.map((option, idx) => ({
                text: option.text,
                isCorrect: idx === parseInt(question.correctAnswer),
            }));

            const questionDoc = new Question({
                questionText: question.questionText,
                options: options,
            });
            return await questionDoc.save();
        }));

        // Create a new quiz with additional fields
        const newQuiz = new Quiz({
            title: title,
            category: category, // Save the category
            duration: parseInt(time), // Save the duration as an integer (convert if necessary)
            questions: savedQuestions.map((q) => q._id), // Reference the question IDs
            owner: userId, // Associate with the user
        });

        await newQuiz.save();

        // Increment the user's createdQuizzesCount
        req.user.createdQuizzesCount += 1;
        await req.user.save();

        req.flash("success", "Quiz created! Share and enjoy on Exampo!");
        res.redirect('/quizzes/new');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: Unable to create the quiz.');
    }
});


router.post('/:id/submit', isLoggedIn, async (req, res) => {
    try {
        let { userAnswers } = req.body;

        // Validate that userAnswers is not empty or malformed
        if (!userAnswers || userAnswers.trim() === "") {
            return res.status(400).send('No answers submitted');
        }

        let parsedAnswers;
        try {
            parsedAnswers = JSON.parse(userAnswers);
        } catch (error) {
            return res.status(400).send('Invalid answer format');
        }

        const quiz = await Quiz.findById(req.params.id).populate('questions');
        if (!quiz) return res.status(404).send('Quiz not found');

        // Create a new Answer document
        const newAnswer = new Answer({
            user: req.user._id,
            quiz: req.params.id,
            answers: parsedAnswers.map((selectedText, index) => ({
                question: quiz.questions[index]._id,
                selectedOption: selectedText // Save the answer text here
            })),
            score: parsedAnswers.reduce((total, answer, index) => {
                const correctOption = quiz.questions[index].options.find(opt => opt.isCorrect).text;
                return total + (answer === correctOption ? 1 : 0);
            }, 0)
        });

        const savedAnswer = await newAnswer.save();
        res.redirect(`/quizzes/${req.params.id}/results/${savedAnswer._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});





router.put('/:id', isLoggedIn, async (req, res) => {
    try {
        const { title, questions } = req.body;

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            req.flash('error', 'Quiz not found');
            return res.redirect('/quizzes');
        }

        // Clear existing questions for the quiz (or handle updates based on your logic)
        quiz.questions = [];  // Reset the questions array

        // Save each question and push its ID to the quiz.questions array
        for (let questionData of questions) {
            const options = questionData.options.map((option, index) => ({
                text: option.text,
                isCorrect: index == questionData.correctAnswer  // Mark the selected correct option
            }));

            const newQuestion = new Question({
                questionText: questionData.questionText,
                options: options
            });

            await newQuestion.save();  // Save the question to the database
            quiz.questions.push(newQuestion._id);  // Push the question's ObjectId to the quiz
        }

        // Update the quiz title
        quiz.title = title;

        // Save the updated quiz
        await quiz.save();

        req.flash('success', 'Quiz updated successfully!');
        res.redirect(`/quizzes/${quiz._id}`);
    } catch (err) {
        console.error("Error updating quiz:", err);
        req.flash("error", "Failed to update quiz. You can't remove all the questions");
        res.redirect(`/quizzes/${req.params.id}/edit`);
    }
});


// DELETE route to delete a quiz
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const quizId = req.params.id;

        // Find the quiz to delete
        const quiz = await Quiz.findById(quizId);

        // Ensure the current user is the owner of the quiz
        if (!quiz.owner.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to delete this quiz.');
            return res.redirect(`/quizzes/${quizId}`);
        }

        // Delete all reviews associated with the quiz
        await Review.deleteMany({ quiz: quizId });

        // Delete the quiz itself
        await Quiz.findByIdAndDelete(quizId);

        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');  // Redirect to the list of quizzes
    } catch (err) {
        console.error('Error deleting quiz:', err);
        req.flash('error', 'Error deleting quiz. Please try again.');
        res.redirect(`/quizzes/${req.params.id}`);
    }
});

module.exports = router;