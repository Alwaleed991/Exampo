const mongoose = require('mongoose');
const Quiz = require('../models/Quiz'); // Adjust the path based on your folder structure
const User = require('../models/user'); // Assuming you have at least one user in the database

const seedQuizzes = async () => {
    try {
        // Connect to your database
        await mongoose.connect('mongodb://127.0.0.1:27017/exampo', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to the database.');

        // Remove all existing quizzes to avoid duplicates during testing
        await Quiz.deleteMany({});
        console.log('Existing quizzes removed.');

        // Assuming you have at least one user in the database to assign as the quiz owner
        const user = await User.findOne(); // Use the first user as the quiz owner
        if (!user) {
            throw new Error('No users found in the database. Create a user first.');
        }

        // Predefined categories
        const categories = [
            'General Knowledge',
            'Science',
            'Education',
            'History',
            'Geography',
            'Literature',
            'Movies and TV Shows',
            'Music',
            'Sport',
            'Technology',
        ];

        // Generate 40 quizzes
        const quizzes = [];
        for (let i = 1; i <= 40; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)]; // Randomly pick a category
            quizzes.push({
                title: `Quiz ${i} in ${randomCategory}`,
                description: `A fun quiz about ${randomCategory}.`,
                category: randomCategory,
                questions: [], // Empty for now, as the focus is on categories and titles
                owner: user._id,
                duration: Math.floor(Math.random() * 20 + 10) * 60, // Random duration between 10 and 30 minutes
            });
        }

        // Insert quizzes into the database
        await Quiz.insertMany(quizzes);
        console.log('40 sample quizzes created successfully.');

        // Disconnect from the database
        mongoose.connection.close();
        console.log('Disconnected from the database.');
    } catch (error) {
        console.error('Error seeding data:', error);
        mongoose.connection.close();
    }
};

// Run the seed function
seedQuizzes();
