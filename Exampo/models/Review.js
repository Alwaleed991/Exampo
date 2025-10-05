// /models/Review.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },  // Rating from 1 to 5 stars
    comment: { type: String },  // Optional comment
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },  // Quiz being reviewed
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // User who submitted the review
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);