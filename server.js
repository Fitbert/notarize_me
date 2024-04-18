const express = require('express');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./Model/User'); // Assuming you have a User model
const sequelize = require('./config/database'); // Assuming you have Sequelize configured


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const sess = {
  secret: process.env.SESSION_SECRET || 'Super secret secret',
  cookie: {},
  resave: false,
  saveUninitialized: true,
};

app.use(session(sess));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hbs = exphbs.create({
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views', 'partials'),
  views: path.join(__dirname, 'views')
});

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));

// Connect to the database
sequelize.authenticate()
  .then(() => console.log('Connected to the database'))
  .catch(error => console.error('Error connecting to the database:', error));

// Route to render the main HTML page
app.get('/', (req, res) => {
  res.render('editdraft'); // Render the editdraft partial
});

// Route for user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route for user logout
app.get('/logout', (req, res) => {
  req.session.authenticated = false;
  res.redirect('/');
});

// Route to render the create account page
app.get('/create', (req, res) => {
  res.render('create'); // Render the create account partial
});

// Express route for user signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Save user data to database
    await User.create({ username, email, password: hashedPassword });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Allow CORS requests from localhost for development purposes
const allowedOrigins = ['http://localhost:*'];
app.use(cors({
  origin: allowedOrigins,
}));
app.options('*', cors());

// Handle file upload
app.post('/upload',
  fileUpload({ createParentPath: true }),
  async (req, res) => {
    try {
      const files = req.files;

      const movePromises = [];
      Object.keys(files).forEach(key => {
        if (files[key]) {
          const filepath = path.join(__dirname, 'files', files[key].name);
          movePromises.push(files[key].mv(filepath));
          console.log(files[key].name);
          console.log(files[key].size);
        }
      });

      await Promise.all(movePromises);

      return res.json({ status: 'success', message: Object.keys(files).toString() });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});
