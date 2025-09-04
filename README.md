# GraphQL Study API

A GraphQL API built with Node.js, Express, Apollo Server, and MongoDB for learning purposes.

## Features

- User management (create, query)
- Note management (create, read, update, delete)
- Tag-based note organization
- Authentication ready (basic setup)
- MongoDB integration with Mongoose

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd graphql-study
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/study-graphql
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The GraphQL Playground will be available at `http://localhost:4000/graphql`

## Example Queries and Mutations

### Create a User
```graphql
mutation {
  createUser(input: {
    username: "johndoe",
    email: "john@example.com",
    password: "securepassword123"
  }) {
    id
    username
    email
  }
}
```

### Create a Note
```graphql
mutation {
  createNote(input: {
    title: "First Note",
    content: "This is my first note!",
    tags: ["important", "personal"],
    authorId: "USER_ID_HERE"
  }) {
    id
    title
    content
    tags
    author {
      username
    }
  }
}
```

### Query Notes by Tag
```graphql
query {
  notesByTag(tag: "important") {
    id
    title
    content
    tags
    author {
      username
    }
  }
}
```

## Project Structure

```
graphql-study/
├── src/
│   ├── models/         # Mongoose models
│   │   ├── User.js
│   │   └── Note.js
│   ├── resolvers/      # GraphQL resolvers
│   │   └── index.js
│   ├── schema/         # GraphQL type definitions
│   │   └── typeDefs.js
│   └── index.js        # Application entry point
├── .env.example       # Example environment variables
├── package.json
└── README.md
```

## Next Steps

- Add authentication middleware
- Implement file uploads
- Add pagination for queries
- Add rate limiting
- Write tests
- Add input validation

## License

MIT
