const { MongoClient } = require('mongodb');
require('dotenv').config(); // To load the .env file

const uri = process.env.MONGO_URI;  // MongoDB connection string from .env file
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB Atlas!");

    // Database and collection (you can move these operations to other files as well)
    const database = client.db('myDatabase');
    const collection = database.collection('myCollection');

    // Insert a document (example)
    const result = await collection.insertOne({ name: "John Doe", age: 30 });
    console.log(`Document inserted with _id: ${result.insertedId}`);
    
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } 
}

// Export the connect function
module.exports = { connectToMongoDB };