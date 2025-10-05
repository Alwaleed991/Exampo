const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionText: { type: String, required: true },
    options: [
        {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, required: true }
        }
    ],
    questionType: { type: String, enum: ['multiple-choice', 'true-false'], default: 'multiple-choice' }
});

module.exports = mongoose.model('Question', questionSchema);
