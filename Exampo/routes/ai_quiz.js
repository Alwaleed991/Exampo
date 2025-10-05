const express = require("express");
const router = express.Router({ mergeParams: true });
const Quiz = require('../models/Quiz');  // Quiz model
const Question = require('../models/Question');  // Question model
const Review = require('../models/Review'); 
const Answer = require('../models/Answer');
const { isLoggedIn } = require("../middlewares")
const generateQuiz = require("../services/generateAIQuiz")

router.get("/new", isLoggedIn, (req,res) => {
    res.render("quizzes/create_ai_quiz")
})

router.get("/test", async(req,res)=>{
  const quiz = await generateQuiz("lesson on multiplication", 5)
  console.log(quiz)
  res.send(quiz)
})

router.post('/create', isLoggedIn, async (req, res) => {
  const { subject, questionCount, quizTime } = req.body;
  const ownerId = req.user._id;

  try {
    // Generate the quiz using AI
    const generatedQuiz = await generateQuiz(subject, questionCount);

    // Destructure the title and category from the generated response
    const { title, category, quiz } = generatedQuiz;

    // Save the questions to the database
    const savedQuestions = await Promise.all(
      quiz.map(async (q) => {
        const options = Object.keys(q.options).map((key) => ({
          text: q.options[key],
          isCorrect: key === q.correctAnswer,
        }));
        const question = new Question({
          questionText: q.question,
          options,
          questionType: 'multiple-choice', // Assuming all are multiple-choice
        });
        return question.save();
      })
    );

    // Save the quiz to the database
    const newQuiz = new Quiz({
      title,
      category,
      questions: savedQuestions.map((q) => q._id), // Reference the saved questions
      owner: ownerId, // User ID of the quiz creator
      duration: quizTime, // Quiz duration
    });

    const savedQuiz = await newQuiz.save();

    res.redirect("/quizzes/"+savedQuiz._id)

  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
