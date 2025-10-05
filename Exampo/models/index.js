const mongoose = require("mongoose");

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/exampo"

const connectToDatabase = async() => {
    try{
        await mongoose.connect(dbUrl)
        console.log("CONNECTED TO THE DATABASE..")
    }
    catch(error){
        console.error(error);
    }
}

module.exports = {connectToDatabase, dbUrl}