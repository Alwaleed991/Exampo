const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const User = require('../models/user');
const Quiz = require('../models/Quiz');
const Review = require('../models/Review');
const { isLoggedIn, isAdmin } = require("../middlewares")


// router.get('/dashboard', async (req, res) => {
//     try {
//         // Fetch all users, quizzes, and reviews
//         const users = await User.find().select('username email _id').lean();
//         const quizzes = await Quiz.find().select('_id title owner').lean(); // Ensure we select the correct fields
//         const reviews = await Review.find().select('rating quiz user').lean();

//         // Calculate total comments for the system dynamically
//         const totalComments = reviews.filter(review =>
//             quizzes.some(quiz => quiz._id && quiz._id.toString() === review.quiz?.toString())
//         ).length;

//         // Prepare user management data
//         const userManagementData = users.map(user => {
//             // Count quizzes made by the user
//             const quizzesMade = quizzes.filter(quiz => quiz.owner && quiz.owner.toString() === user._id.toString()).length;

//             // Count comments written by the user (and ensure related quizzes still exist)
//             const totalCommentsByUser = reviews
//                 .filter(review => review.user && review.user.toString() === user._id.toString())
//                 .filter(review => quizzes.some(quiz => quiz._id && quiz._id.toString() === review.quiz?.toString()))
//                 .length;

//             return {
//                 ...user,
//                 quizzesMade,
//                 totalComments: totalCommentsByUser, // Total valid comments written by this user
//             };
//         });

//         // Total users
//         const totalUsers = users.length;

//         // Total quizzes
//         const totalQuizzes = quizzes.length;

//         // Prepare quiz management data
//         const quizManagementData = quizzes.map(quiz => {
//             // Find all reviews for this quiz
//             const quizReviews = reviews.filter(review => review.quiz && review.quiz.toString() === quiz._id.toString());

//             // Calculate average rating for this quiz
//             const ratings = quizReviews.length > 0
//                 ? (quizReviews.reduce((sum, review) => sum + review.rating, 0) / quizReviews.length).toFixed(1)
//                 : 0;

//             // Calculate the total comments for this quiz
//             const comments = quizReviews.length;

//             // Find the creator's username
//             const creator = users.find(user => user._id && user._id.toString() === quiz.owner?.toString())?.username || 'Unknown';

//             return {
//                 title: quiz.title,
//                 creator,
//                 comments,
//                 ratings,
//             };
//         });


//         // Render the admin dashboard
//         res.render('Quizzes/Admin_page', {
//             userManagementData,
//             quizManagementData,
//             totalUsers,
//             totalQuizzes,
//             totalComments, // Now updated dynamically
//         });
//     } catch (err) {
//         console.error('Error loading dashboard:', err);
//         res.status(500).send('Error loading dashboard');
//     }
// });


/////////////////the gote
router.get('/dashboard', isLoggedIn, isAdmin, async (req, res) => {
    try {
        // Fetch all users, quizzes, and reviews
        const users = await User.find().select('username email _id').lean();
        const quizzes = await Quiz.find().select('_id title owner').lean(); // Ensure we select the correct fields
        const reviews = await Review.find().select('rating quiz user').lean();

        // Remove admin user from the users array
        const filteredUsers = users.filter(user => user.username !== 'admin');

        // Calculate total comments for the system dynamically
        const totalComments = reviews.filter(review =>
            quizzes.some(quiz => quiz._id && quiz._id.toString() === review.quiz?.toString())
        ).length;

        // Prepare user management data
        const userManagementData = filteredUsers.map(user => {
            // Count quizzes made by the user
            const quizzesMade = quizzes.filter(quiz => quiz.owner && quiz.owner.toString() === user._id.toString()).length;

            // Count comments written by the user (and ensure related quizzes still exist)
            const totalCommentsByUser = reviews
                .filter(review => review.user && review.user.toString() === user._id.toString())
                .filter(review => quizzes.some(quiz => quiz._id && quiz._id.toString() === review.quiz?.toString()))
                .length;

            return {
                ...user,
                quizzesMade,
                totalComments: totalCommentsByUser, // Total valid comments written by this user
            };
        });

        // Total users
        const totalUsers = filteredUsers.length;

        // Total quizzes
        const totalQuizzes = quizzes.length;

        // Prepare quiz management data
        const quizManagementData = quizzes.map(quiz => {
            // Find all reviews for this quiz
            const quizReviews = reviews.filter(review => review.quiz && review.quiz.toString() === quiz._id.toString());

            // Calculate average rating for this quiz
            const ratings = quizReviews.length > 0
                ? (quizReviews.reduce((sum, review) => sum + review.rating, 0) / quizReviews.length).toFixed(1)
                : 0;

            // Calculate the total comments for this quiz
            const comments = quizReviews.length;

            // Find the creator's username
            const creator = users.find(user => user._id && user._id.toString() === quiz.owner?.toString())?.username || 'Unknown';

            return {
                quizId: quiz._id, // Add quiz ID to pass to the front end
                title: quiz.title,
                creator,
                comments,
                ratings,
            };
        });

        // Render the admin dashboard
        res.render('quizzes/admin_page', {
            userManagementData,
            quizManagementData,
            totalUsers,
            totalQuizzes,
            totalComments, // Now updated dynamically
        });
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).send('Error loading dashboard');
    }
});





//////////////
// router.delete('/users/:id', async (req, res) => {
//     try {
//         const userId = req.params.id;

//         // Validate if the userId is a valid ObjectId
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             req.flash('error', 'Invalid User ID.');
//             return res.redirect('/admin/dashboard');
//         }

//         // Use the validated ObjectId directly
//         const objectId = mongoose.Types.ObjectId(userId);

//         // Delete associated data
//         await Quiz.deleteMany({ owner: objectId }); // Delete quizzes created by the user
//         await Review.deleteMany({ user: objectId }); // Delete reviews made by the user

//         // Delete the user
//         const user = await User.findByIdAndDelete(objectId);

//         // If no user was found
//         if (!user) {
//             req.flash('error', 'User not found.');
//             return res.redirect('/admin/dashboard');
//         }

//         // Flash success message and redirect
//         req.flash('success', 'User and associated data deleted successfully.');
//         return res.redirect('/admin/dashboard');
//     } catch (error) {
//         console.error('Error deleting user:', error);
//         req.flash('error', 'An error occurred while deleting the user.');
//         return res.redirect('/admin/dashboard');
//     }
// });

// DELETE route to delete a user, their quizzes, and associated reviews
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Find the user to delete
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/profile');
        }

        // Step 1: Delete all quizzes created by this user
        const quizzes = await Quiz.find({ owner: userId });

        for (const quiz of quizzes) {
            // Delete all reviews associated with the quiz
            await Review.deleteMany({ quiz: quiz._id });

            // Delete the quiz itself
            await Quiz.findByIdAndDelete(quiz._id);
        }

        // Step 2: Delete all reviews written by the user (even if the review is on other users' quizzes)
        await Review.deleteMany({ user: userId });

        // Step 3: Delete the user
        await User.findByIdAndDelete(userId);

        req.flash('success', 'Account and all associated data deleted successfully.');
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'Server error');
        return res.redirect('/profile');
    }
});

// DELETE route to delete a quiz
router.delete('/quiz/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const quizId = req.params.id;

        // Delete all reviews associated with the quiz
        await Review.deleteMany({ quiz: quizId });

        // Delete the quiz itself
        await Quiz.findByIdAndDelete(quizId);

        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/admin/dashboard'); // Redirect to the admin dashboard
    } catch (err) {
        console.error('Error deleting quiz:', err);
        req.flash('error', 'Error deleting quiz. Please try again.');
        res.redirect('/admin/dashboard'); // Redirect to the admin dashboard on error
    }
});



module.exports = router;
