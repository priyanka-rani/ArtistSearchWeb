const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const path = require('path');


// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist/frontend')));


function authenticated(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

function unauthenticated(req, res, next) {
  if (req.cookies.token) return res.status(403).json({ message: 'Already logged in' });
  next();
}

// Config
const clientID = process.env.ARTSY_CLIENT_ID;
const clientSecret = process.env.ARTSY_CLIENT_SECRET;
const BASE_URL = 'https://api.artsy.net/api';
const mongoURI = process.env.MONGO_URI;

const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const databaseName = 'myDatabase';
const userCollection = 'users';

// MongoDB Connect
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// Get Artsy API Token
const fs = require('fs');
const tokenCachePath = path.join('/tmp', 'tokenCache.json');

async function getAccessToken() {
  const now = new Date();

  if (fs.existsSync(tokenCachePath)) {
    const data = JSON.parse(fs.readFileSync(tokenCachePath, 'utf-8'));

    if (data.token && new Date(data.expires_at) > now) {
      return data.token; // Return cached token
    }
  }

  try {
    const response = await axios.post(`${BASE_URL}/tokens/xapp_token`, null, {
      params: {
        client_id: clientID,
        client_secret: clientSecret
      }
    });

    const newToken = response.data.token;
    const expiresAt = new Date(response.data.expires_at);

    // Step 3: Write new token to file
    fs.writeFileSync(tokenCachePath, JSON.stringify({
      token: newToken,
      expires_at: expiresAt.toISOString()
    }));

    console.log('New Artsy token fetched and cached.');
    return newToken;
  } catch (error) {
    console.error('Error fetching Artsy token:', error.message);
    throw error;
  }
}

const crypto = require('crypto');

function generateGravatarUrl(email) {
  const trimmed = email.trim().toLowerCase();
  const hash = crypto.createHash('sha1').update(trimmed).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

async function registerUser(req, res) {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  try {
    const db = client.db(databaseName);
    const users = db.collection(userCollection);

    const existingUser = await users.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const gravatarUrl = generateGravatarUrl(email);
    const newUser = { fullName, email, password: hashedPassword, avatar: gravatarUrl  };

    const result = await users.insertOne(newUser);

    const token = jwt.sign(
      { userId: result.insertedId, fullName, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000
    });

    res.status(201).json({ message: 'User registered successfully.'});
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
}

// Login
async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const db = client.db(databaseName);
    const users = db.collection(userCollection);

    const user = await users.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { userId: user._id, fullName: user.fullName, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 hour
    });
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

// Logout Route
app.post('/api/logout', authenticated, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

// /api/me - returns current user if authenticated
app.get('/api/me', authenticated, async (req, res) => {
  const db = client.db(databaseName);
  const users = db.collection(userCollection);
  const user = await users.findOne({ email: req.user.email });

  if (!user) return res.sendStatus(404);

  res.json({
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar || null
  });
});

// Delete Account
app.delete('/api/account', authenticated, async (req, res) => {
  const db = client.db(databaseName);
  const users = db.collection(userCollection);
  const favorites = db.collection('favorites');

  // Delete the user
  await users.deleteOne({ email: req.user.email });

  // Delete all favorites for this user
  await favorites.deleteMany({ userEmail: req.user.email });

  // Clear the auth cookie
  res.clearCookie('token');
  res.status(200).json({ message: 'Account deleted' });
});

// Search Artists
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const token = await getAccessToken();
    const response = await axios.get(`${BASE_URL}/search`, {
      headers: { 'X-XAPP-Token': token },
      params: { q: query, type: 'artist', size: 10 }
    });

    const artists = response.data._embedded.results
      .filter(r => r.type === 'artist')
      .map(artist => ({
        id: artist._links.self.href.split('/').pop(),
        name: artist.title,
        links: artist._links
      }));

    res.status(200).json({ artists });
  } catch (error) {
    console.error('Artist search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get Artist Details
app.get('/api/artists/:id', async (req, res) => {
  try {
    const token = await getAccessToken();
    const url = `${BASE_URL}/artists/${req.params.id}`;
    const response = await axios.get(url, {
      headers: { 'X-XAPP-Token': token }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Artist fetch error:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// Get Categories for an Artwork (Genes)
app.get('/api/artworks/:artworkId/categories', async (req, res) => {
  const { artworkId } = req.params;

  try {
    const token = await getAccessToken();
    const response = await axios.get(`${BASE_URL}/genes`, {
      headers: { 'X-XAPP-Token': token },
      params: { artwork_id: artworkId }
    });

    const categories = response.data._embedded.genes.map(gene => ({
      name: gene.name,
      image: gene._links?.thumbnail?.href || 'images/artsy_logo.svg'
    }));

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching artwork categories:', error.message);
    res.status(500).json({ error: 'Failed to fetch artwork categories' });
  }
});
// Get Similar Artists
app.get('/api/artists/:id/similar', async (req, res) => {
  try {
    const token = await getAccessToken();
    const url = `${BASE_URL}/artists?similar_to_artist_id=${req.params.id}&size=10`;
    const response = await axios.get(url, {
      headers: { 'X-XAPP-Token': token }
    });

    const similarArtists = response.data._embedded.artists
    res.status(200).json(similarArtists);
  } catch (error) {
    console.error('Similar artists fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch similar artists' });
  }
});

// Get Artworks for an Artist
app.get('/api/artists/:id/artworks', async (req, res) => {
  const artistId = req.params.id;
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${BASE_URL}/artworks`, {
      headers: { 'X-XAPP-Token': token },
      params: {
        artist_id: artistId,
        size: 10
      }
    });

    const artworks = response.data._embedded.artworks.map((artwork) => ({
      id: artwork.id,
      title: artwork.title,
      date: artwork.date,
      links: artwork._links
    }));

    res.status(200).json(artworks);
  } catch (error) {
    console.error('Error fetching artworks:', error.message);
    res.status(500).json({ error: 'Error fetching artworks' });
  }
});

// Get all favorites for logged-in user
app.get('/api/favorites', authenticated, async (req, res) => {
  const db = client.db('myDatabase');
  const favorites = db.collection('favorites');

  const results = await favorites.find({ userEmail: req.user.email }).toArray();
  res.json(results);
});

// Add an artist to favorites
app.post('/api/favorites', authenticated, async (req, res) => {
  const { artistId, name, image, birth_year, death_year, nationality, addedAt } = req.body;

  if (!artistId || !name) {
    return res.status(400).json({ message: 'Artist ID and name are required.' });
  }

  const db = client.db('myDatabase');
  const favorites = db.collection('favorites');

  const exists = await favorites.findOne({ userEmail: req.user.email, artistId });
  if (exists) {
    return res.status(409).json({ message: 'Already in favorites' });
  }

  await favorites.insertOne({
    userEmail: req.user.email,
    artistId,
    name,
    image,
    birth_year,
    death_year,
    nationality,
    addedAt: new Date()
  });

  res.status(201).json({ message: 'Favorite added' });
});


// Remove an artist from favorites
app.delete('/api/favorites/:artistId', authenticated, async (req, res) => {
  const db = client.db('myDatabase');
  const favorites = db.collection('favorites');

  await favorites.deleteOne({ userEmail: req.user.email, artistId: req.params.artistId });
  res.status(200).json({ message: 'Favorite removed' });
});

// Routes
app.post('/api/register', unauthenticated, registerUser);
app.post('/api/login', unauthenticated, loginUser);

app.get(/(.*)/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist/frontend/index.html'));
  }
});

// Start Server
connectToMongoDB();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));