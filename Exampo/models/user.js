const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    createdQuizzesCount: {
        type: Number,
        default: 0  // Default value for new users
    }
});

UserSchema.plugin(passportLocalMongoose, {
    usernameCaseInsensitive: true
})
module.exports = mongoose.model("User", UserSchema);
