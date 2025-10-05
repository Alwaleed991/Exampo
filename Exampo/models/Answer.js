const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: [
        {
            question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
            selectedOption: { type: String }
        }
    ],
    score: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);
