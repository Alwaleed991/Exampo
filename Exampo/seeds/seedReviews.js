const mongoose = require('mongoose');
const Review = require('../models/Review'); // Adjust the path if needed
const Quiz = require('../models/Quiz');
const User = require('../models/user');

// Random comments to seed
const comments = [
  "Great quiz! I really enjoyed it.",
  "The questions were too difficult.",
  "I loved the variety of questions.",
  "Good quiz, but the timer was too short.",
  "Interesting quiz, but some answers seemed wrong.",
  "Perfect for learning new topics.",
  "It was okay, not too challenging.",
  "This quiz was very engaging and informative!",
  "I didn’t enjoy this one much.",
  "Well-designed quiz! Kudos to the creator."
];

// Function to generate a random comment
function getRandomComment() {
  return comments[Math.floor(Math.random() * comments.length)];
}

// Function to generate a random rating (1 to 5 stars)
function getRandomRating() {
  return Math.floor(Math.random() * 5) + 1;
}

const seedReviews = async () => {
  try {
    // Connect to the database
    await mongoose.connect('mongodb://127.0.0.1:27017/Exampo', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to database.');

    // Fetch all quizzes and users
    const quizzes = await Quiz.find({});
    const users = await User.find({});

    if (quizzes.length === 0 || users.length === 0) {
      console.log('No quizzes or users found in the database. Seed some first.');
      return;
    }

    // Clear all existing reviews
    await Review.deleteMany({});
    console.log('Existing reviews removed.');

    // Create random reviews
    const reviews = [];
    for (let i = 0; i < 50; i++) {
      const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      reviews.push({
        rating: getRandomRating(),
        comment: getRandomComment(),
        quiz: randomQuiz._id,
        user: randomUser._id
      });
    }

    // Insert the reviews into the database
    await Review.insertMany(reviews);
    console.log('Seeded 50 random reviews.');

    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from database.');
  } catch (error) {
    console.error('Error seeding reviews:', error);
    mongoose.connection.close();
  }
};

// Run the seed function
seedReviews();
