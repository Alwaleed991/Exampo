
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');


const predefinedCategories = [
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


router.get('/', async (req, res) => {
    try {
        // Trim and convert the search term to lowercase, default to an empty string
        const searchTerm = req.query.q?.trim().toLowerCase() || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 16;

        let query = {};

        if (searchTerm) {
            // If search term matches predefined categories
            if (predefinedCategories.map(cat => cat.toLowerCase()).includes(searchTerm)) {
                query = { category: new RegExp(searchTerm, 'i') }; // Case-insensitive match by category
            } else {
                query = { title: new RegExp(searchTerm, 'i') }; // Case-insensitive match by title
            }
        }

        // Fetch paginated quizzes
        const quizzes = await Quiz.find(query)
            .populate('owner', 'email username') // Populate owner fields
            .populate('questions') // Populate questions
            .skip((page - 1) * limit) // Pagination skip
            .limit(limit); // Limit results

        // If no quizzes found
        if (quizzes.length === 0) {
            return res.render('Quizzes/not_find', { searchTerm });
        }

        // Total quizzes and pages
        const totalQuizzes = await Quiz.countDocuments(query);
        const totalPages = Math.ceil(totalQuizzes / limit);

        // Render quizzes
        res.render('Quizzes/all_quizzes', { quizzes, currentPage: page, totalPages, searchTerm });
    } catch (err) {
        console.error('Error fetching quizzes:', err);
        res.status(500).send('Server Error');
    }
});




module.exports = router;
