const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors());

// Serve static files from the public directory
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGODB_URI = 'mongodb://localhost:27017/study-graphql';

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    // You can add authentication context here
    user: req?.user,
  }),
  formatError: (error) => {
    // Don't expose internal server errors to the client
    if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      console.error('Internal server error:', error);
      return new Error('Internal server error');
    }
    return error;
  },
  debug: true
});

// Start the server after database connection is established
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Verify the connection
    const db = mongoose.connection;
    db.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    db.once('open', () => {
      console.log('MongoDB connection is open');
    });

    // Start Apollo Server
    await server.start();
    
    // Apply Apollo GraphQL middleware
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`🚀 GraphQL server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
