const { MongoClient } = require('mongodb');

async function dropDatabase() {
  const uri = 'mongodb://127.0.0.1:27017/Exampo'; // Connection URI

  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Connected to MongoDB');

    // Get the database object
    const db = client.db();

    // Drop the database
    await db.dropDatabase();
    console.log('Database dropped successfully.');

  } catch (error) {
    console.error('Error dropping database:', error);
  } finally {
    // Close the connection
    await client.close();
    process.exit(0);
  }
}

// Run the function to drop the database
dropDatabase();
