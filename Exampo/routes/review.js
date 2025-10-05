const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require('../models/Review'); 
const Quiz = require('../models/Quiz');
const { isLoggedIn } = require("../middlewares")

// Route to handle review submission for a specific quiz
router.post('/', isLoggedIn, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const quizId = req.params.id;

        // Create a new review object
        const newReview = new Review({
            rating: parseInt(rating, 10),
            comment: comment || '', // Comment is optional, so default to an empty string
            quiz: quizId,
            user: req.user._id  // Assuming the user is logged in and available as `req.user`
        });

        // Save the review
        await newReview.save();

        // Redirect back to the quiz details page
        res.redirect(`/quizzes/${quizId}`);
    } catch (err) {
        console.error("Error saving review:", err);
        req.flash('error', 'Unable to submit review. Please try again.');
        res.redirect(`/quizzes/${req.params.id}`);
    }
});

// DELETE review route
router.delete('/:reviewId', isLoggedIn, async (req, res) => {
    try {
        const { id, reviewId } = req.params;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            req.flash('error', 'Review not found.');
            return res.redirect(`/quizzes/${id}`);
        }

        // Ensure the logged-in user is the author of the review
        if (!review.user.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to delete this review.');
            return res.redirect(`/quizzes/${id}`);
        }

        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        // Optionally, remove the review from the quiz (depends on your schema)
        await Quiz.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

        req.flash('success', 'Review deleted successfully.');
        res.redirect(`/quizzes/${id}`);
    } catch (err) {
        console.error("Error deleting review:", err);
        req.flash('error', 'Error deleting review. Please try again.');
        res.redirect(`/quizzes/${id}`);
    }
});


module.exports = router;