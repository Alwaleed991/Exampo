// /models/Quiz.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./Review');

// Function to generate random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


const quizSchema = new Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    hoverColor: { type: String },
    duration: { type: Number, required: true }, // New field for total time in seconds or minutes
    createdAt: { type: Date, default: Date.now }
});

// Virtual field to populate reviews
quizSchema.virtual('reviews', {
    ref: 'Review', 
    localField: '_id',  
    foreignField: 'quiz'  
});

// Pre-save hook to generate random color before saving the quiz
quizSchema.pre('save', function(next) {
    if (!this.hoverColor) {
        this.hoverColor = getRandomColor();  // Assign random color if not already set
    }
    next();
});

// Method to calculate average rating
quizSchema.methods.calculateAverageRating = async function() {
    const reviews = await Review.find({ quiz: this._id });
    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
};

module.exports = mongoose.model('Quiz', quizSchema);

