if(process.env.NODE_ENV !== "production"){
  require('dotenv').config();
}
const express = require('express');
const userRoutes = require("./routes/user");
const quizRoutes = require("./routes/quiz");
const reviewRoutes = require("./routes/review");
const path = require("path");
const session = require("express-session")
const {connectToDatabase} = require("./models");
const User = require("./models/user")
const passport = require("passport")
const LocalStratigy = require("passport-local")
const flash = require("connect-flash")
const ejsMate = require("ejs-mate")
const methodOverride = require('method-override');
const Quiz = require('./models/Quiz');  // Quiz model
const searchRouter = require('./routes/search');
const adminRoutes = require('./routes/admin');
const aiQuizRoutes = require('./routes/ai_quiz');
const MongoStore = require('connect-mongo');


connectToDatabase()
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/exampo"
const secret = process.env.SECRET|| 'thisshouldbeabettersecret!'

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
      secret,
  }
});

const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      // secure: true,
      expires: Date.now() + 1000*60*60*24*7, //A week from now
      maxAge: 1000*60*60*24*7
  }
}

app.use(session(sessionConfig))
app.use(flash())

//Initialize Passport For Authentication
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStratigy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use((req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.success = req.flash("success")
  res.locals.error = req.flash("error")
  next()
})

app.use("/",userRoutes);
app.use("/quizzes",quizRoutes);
app.use("/quizzes/:id/reviews",reviewRoutes);
app.use("/quizzes-ai",aiQuizRoutes);
app.use('/search', searchRouter);
app.use('/admin', adminRoutes);

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get('/home', async (req, res) => {
  try {
      // Fetch the latest 4 quizzes from the database, sorted by creation date
      const recentQuizzes = await Quiz.find()
          .sort({ createdAt: -1 }) // Sort by most recent
          .limit(4)
          .populate('owner', 'username'); // Populate owner's username

      // Fetch all quizzes first, because we need to calculate and sort by average rating
      const allQuizzes = await Quiz.find()
          .populate('owner', 'username'); // Populate owner's username

      // Calculate average rating for recent quizzes
      for (const quiz of recentQuizzes) {
        quiz.averageRating = await quiz.calculateAverageRating();
      }

      // Calculate average rating for highest quizzes
      for (const quiz of allQuizzes) {
          quiz.averageRating = await quiz.calculateAverageRating();
      }

      // Filter out quizzes without ratings, then sort by average rating in descending order and take the top 4
      const topRatedQuizzes = allQuizzes
          .filter(quiz => quiz.averageRating !== null)  // Ensure only quizzes with ratings are considered
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 4);  // Limit to top 4

      // Render the home page and pass both recent and top-rated quizzes data
      res.render('home', { recentQuizzes, topRatedQuizzes });
  } catch (err) {
      console.error('Error fetching quizzes:', err);
      res.status(500).send('Server error');
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});