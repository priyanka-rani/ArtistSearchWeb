const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const { registerUser, loginUser } = require('./auth');

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const databaseName = 'myDatabase';
const collectionName = 'users';

// Function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Function to validate passwords
const validatePassword = async (inputPassword, storedPassword) => {
  return bcrypt.compare(inputPassword, storedPassword);
};


const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = { fullName, email, password: hashedPassword };

    const result = await collection.insertOne(newUser);

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: result.insertedId,
        fullName: newUser.fullName,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ Set token in HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 hour
    });

    res.status(201).json({ message: 'User registered successfully.' });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// User Login Route
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Connect to the database
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const validPassword = await validatePassword(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id, fullName: user.fullName, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 hour
    });
    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Error logging in user' });
  }
};

module.exports = { registerUser, loginUser };