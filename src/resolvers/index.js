const User = require('../models/User');
const Note = require('../models/Note');

const resolvers = {
  Query: {
    // User queries
    users: async () => {
      try {
        console.log('Fetching users...');
        const users = await User.find({}).populate({
          path: 'notes',
          model: 'Note'
        });
        console.log('Users found:', users);
        return users || [];
      } catch (error) {
        console.error('Error in users resolver:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
    },
    user: async (_, { id }) => {
      try {
        const user = await User.findById(id).populate({
          path: 'notes',
          model: 'Note'
        });
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
    },

    // Note queries
    notes: async () => {
      try {
        console.log('Fetching notes...');
        const notes = await Note.find({}).populate({
          path: 'author',
          model: 'User',
          select: 'username email'
        });
        console.log('Notes found:', notes);
        return notes || [];
      } catch (error) {
        console.error('Error in notes resolver:', error);
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }
    },
    note: async (_, { id }) => {
      try {
        const note = await Note.findById(id).populate({
          path: 'author',
          model: 'User',
          select: 'username email'
        });
        if (!note) {
          throw new Error('Note not found');
        }
        return note;
      } catch (error) {
        console.error(`Error fetching note ${id}:`, error);
        throw new Error(`Failed to fetch note: ${error.message}`);
      }
    },
    notesByTag: async (_, { tag }) => {
      try {
        if (!tag || typeof tag !== 'string') {
          throw new Error('Invalid tag provided');
        }
        const notes = await Note.find({ tags: tag.toLowerCase() }).populate({
          path: 'author',
          model: 'User',
          select: 'username email'
        });
        return notes || [];
      } catch (error) {
        console.error(`Error fetching notes by tag '${tag}':`, error);
        throw new Error(`Failed to fetch notes by tag: ${error.message}`);
      }
    },
  },

  Mutation: {
    // User mutations
    createUser: async (_, { input }) => {
      try {
        const { username, email, password } = input;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        
        if (existingUser) {
          throw new Error('User with this email or username already exists');
        }
        
        const user = new User({
          username,
          email,
          password, // Will be hashed by the pre-save hook
        });
        
        return await user.save();
      } catch (error) {
        throw new Error(error.message || 'Error creating user');
      }
    },

    // Note mutations
    createNote: async (_, { input }, context) => {
      try {
        const { title, content, tags, authorId } = input;
        
        // Check if author exists
        const author = await User.findById(authorId);
        if (!author) {
          throw new Error('Author not found');
        }
        
        const note = new Note({
          title,
          content,
          author: authorId,
          tags: tags.map(tag => tag.toLowerCase()),
        });
        
        const savedNote = await note.save();
        
        // Add note reference to user
        author.notes.push(savedNote._id);
        await author.save();
        
        return savedNote.populate('author');
      } catch (error) {
        throw new Error(error.message || 'Error creating note');
      }
    },
    
    updateNote: async (_, { id, title, content, tags }) => {
      try {
        const update = {};
        if (title) update.title = title;
        if (content) update.content = content;
        if (tags) update.tags = tags.map(tag => tag.toLowerCase());
        
        const updatedNote = await Note.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true }
        ).populate('author');
        
        if (!updatedNote) {
          throw new Error('Note not found');
        }
        
        return updatedNote;
      } catch (error) {
        throw new Error(error.message || 'Error updating note');
      }
    },
    
    deleteNote: async (_, { id }) => {
      try {
        const note = await Note.findByIdAndDelete(id);
        if (!note) {
          throw new Error('Note not found');
        }
        
        // Remove note reference from user
        await User.updateOne(
          { _id: note.author },
          { $pull: { notes: note._id } }
        );
        
        return true;
      } catch (error) {
        throw new Error(error.message || 'Error deleting note');
      }
    },
  },
  
  // Resolvers for nested fields
  User: {
    notes: async (user) => {
      try {
        return await Note.find({ _id: { $in: user.notes } });
      } catch (error) {
        throw new Error('Error fetching user notes');
      }
    },
  },
  
  Note: {
    author: async (note) => {
      try {
        return await User.findById(note.author);
      } catch (error) {
        throw new Error('Error fetching note author');
      }
    },
  },
};

module.exports = resolvers;
