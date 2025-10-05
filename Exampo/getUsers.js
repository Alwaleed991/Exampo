const mongoose = require('mongoose');
const User = require('./models/user'); // Adjust the path if necessary

const dbUrl = 'mongodb://127.0.0.1:27017/Exampo'; // Replace with your database name

const fetchUsers = async () => {
    try {
        await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to database.');

        const users = await User.find({}, 'email _id');
        console.log('Users:', users);

        await mongoose.disconnect();
        console.log('Disconnected from database.');
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

fetchUsers();
