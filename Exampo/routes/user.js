const express = require("express");
const router = express.Router();
const User = require("../models/user")
const Quiz = require('../models/Quiz');
const Review = require('../models/Review');
const Answer = require('../models/Answer');
const passport = require("passport")
const { check, validationResult } = require('express-validator');
const { isLoggedIn } = require("../middlewares")



router.get("/register", (req,res) => {
    res.render("users/register")
})

const registerValidator = [
    // Validate fields
    check('username', 'Username is required').notEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one symbol'),
    check('confirm_password', 'Passwords do not match').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
]


router.post("/register", registerValidator, async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are validation errors, flash the messages and redirect back to the register form
        const errorMessages = errors.array().map(error => error.msg);
        req.flash('error', errorMessages.join(' | '));
        return res.redirect('/register');
    }

    try {
        const { username, email, password } = req.body;

        // Check for existing username or email
        const existingUser = await User.findOne({
            $or: [{ username: username }, { email: email }]
        });

        if (existingUser) {
            let errorMessage = '';
            if (existingUser.username === username) {
                errorMessage += 'Username is already taken. ';
            }
            if (existingUser.email === email) {
                errorMessage += 'Email is already registered.';
            }
            req.flash('error', errorMessage.trim());
            return res.redirect('/register');
        }

        // Proceed with registration if no conflicts
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Failed to log in after registration.');
                return res.redirect('/register');
            }

            req.flash("success", "Welcome to Exampo!");
            res.redirect("/home");
        });
    } catch (e) {
        console.error('Error during registration:', e);
        req.flash("error", e.message);
        res.redirect("/register");
    }
});



router.get("/login",(req,res) => {
    res.render("users/login");
})

router.post("/login",passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }), (req,res) => {
    req.flash("success", "Welcome back!")
    const redirectUrl =  res.locals.returnTo || "/home";
    res.redirect(redirectUrl)
})


router.get("/logout", (req, res, next) => {
    req.logout( err => {
        if(err){
            return next(err)
        }
        req.flash("success", "Goodbye!")
        res.redirect("/home")
    })
}) 


router.get("/profile", async (req, res) => {
    try {
        const userId = req.user._id;
        const takenQuizzes = await Answer.countDocuments({ user: userId });
        res.render("users/profile", { takenQuizzes });
    } catch (error) {
        console.error("Error fetching quiz count:", error);
        req.flash("error", "Failed to load profile");
        res.redirect("/");
    }
});


// Update user information
router.put('/users/:id', isLoggedIn, async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/profile');
        }

        // Check if the username is already taken by another user
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
            req.flash('error', 'Username already exists');
            return res.redirect('/profile');
        }

        // Update the user's information
        user.username = username;
        user.email = email;

        await user.save();

        // Re-login the user to update session information
        req.login(user, (err) => {
            if (err) {
                req.flash('error', 'Failed to update session');
                return res.redirect('/profile');
            }

            req.flash('success', 'Profile updated successfully');
            return res.redirect('/profile');
        });

    } catch (error) {
        console.error('Error updating user:', error);
        req.flash('error', 'Server error');
        return res.redirect('/profile');
    }
});



// DELETE route to delete a user, their quizzes, and associated reviews
router.delete('/users/:id', isLoggedIn, async (req, res) => {
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
        return res.redirect('/');
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'Server error');
        return res.redirect('/profile');
    }
});





module.exports = router;