const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    notes: [Note!]!
    createdAt: String!
    updatedAt: String!
  }

  type Note {
    id: ID!
    title: String!
    content: String!
    author: User!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    # User queries
    users: [User!]!
    user(id: ID!): User
    
    # Note queries
    notes: [Note!]!
    note(id: ID!): Note
    notesByTag(tag: String!): [Note!]!
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
  }

  input CreateNoteInput {
    title: String!
    content: String!
    tags: [String!]!
    authorId: ID!
  }

  type Mutation {
    # User mutations
    createUser(input: CreateUserInput!): User!
    
    # Note mutations
    createNote(input: CreateNoteInput!): Note!
    updateNote(id: ID!, title: String, content: String, tags: [String!]): Note!
    deleteNote(id: ID!): Boolean
  }
`;

module.exports = typeDefs;
