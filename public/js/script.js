// API Configuration
const API_URL = 'http://localhost:4000/graphql';
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

// Cache for users data
let usersCache = [];

/**
 * Makes a GraphQL request to the server
 * @param {string} query - The GraphQL query/mutation
 * @param {Object} variables - Variables for the query/mutation
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The response data
 */
async function graphqlRequest(query, variables = {}, options = {}) {
    const { showError = true } = options;
    
    try {
        console.debug('Sending GraphQL request:', { query, variables });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error:', response.status, errorText);
            throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        console.debug('GraphQL Response:', result);
        
        if (result.errors) {
            const errorMessages = result.errors.map(err => err.message).join('\n');
            console.error('GraphQL Errors:', result.errors);
            throw new Error(errorMessages || 'An unexpected error occurred');
        }
        
        return result.data;
    } catch (error) {
        console.error('GraphQL Request Error:', error);
        if (showError) {
            showResponse(error.message || DEFAULT_ERROR_MESSAGE, true);
        }
        throw error;
    }
}

/**
 * Displays a response or error message to the user
 * @param {string|Object} data - The message or data to display
 * @param {boolean} isError - Whether the message is an error
 * @param {number} timeout - Time in ms to auto-hide the message (0 = don't hide)
 */
function showResponse(data, isError = false, timeout = 5000) {
    const responseElement = document.getElementById('response');
    if (!responseElement) return;
    
    // Clear any existing timeouts
    if (responseElement.timeoutId) {
        clearTimeout(responseElement.timeoutId);
    }
    
    // Create appropriate alert HTML
    let alertHtml = '';
    if (isError) {
        const errorMessage = typeof data === 'string' ? data : 'An unexpected error occurred';
        alertHtml = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                <span>${errorMessage}</span>
            </div>
        `;
    } else if (typeof data === 'string') {
        alertHtml = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <span>${data}</span>
            </div>
        `;
    } else {
        // For objects/arrays, show as formatted JSON
        alertHtml = `
            <div class="alert alert-info">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }
    
    // Update the DOM
    responseElement.innerHTML = alertHtml;
    responseElement.style.display = 'block';
    
    // Auto-hide non-error messages after timeout
    if (!isError && timeout > 0) {
        responseElement.timeoutId = setTimeout(() => {
            responseElement.style.display = 'none';
        }, timeout);
    }
}

/**
 * Renders users in the users grid
 * @param {Array} users - Array of user objects
 */
function renderUsers(users) {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;
    
    // Show loading state
    if (users === null) {
        usersGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading users...</p>
            </div>
        `;
        return;
    }
    
    // Handle empty state
    if (!users || users.length === 0) {
        usersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>No users found</p>
            </div>
        `;
        return;
    }

    // Render user cards
    usersGrid.innerHTML = users.map(user => `
        <div class="card user-card fade-in">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-user"></i>
                    <span>${escapeHtml(user.username)}</span>
                </h3>
            </div>
            <div class="card-body">
                <p class="card-text">
                    <i class="fas fa-envelope"></i>
                    <a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>
                </p>
                <div class="user-stats">
                    <span class="badge">
                        <i class="fas fa-sticky-note"></i>
                        ${user.notes?.length || 0} notes
                    </span>
                </div>
            </div>
            <div class="card-footer">
                <small class="text-muted">
                    <i class="far fa-calendar-alt"></i>
                    Created ${formatDate(user.createdAt)}
                </small>
            </div>
        </div>
    `).join('');
}

/**
 * Renders notes in the notes grid
 * @param {Array} notes - Array of note objects
 */
function renderNotes(notes) {
    const notesGrid = document.getElementById('notesGrid');
    if (!notesGrid) return;
    
    // Show loading state
    if (notes === null) {
        notesGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading notes...</p>
            </div>
        `;
        return;
    }
    
    // Handle empty state
    if (!notes || notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="far fa-sticky-note"></i>
                <p>No notes found</p>
            </div>
        `;
        return;
    }

    // Render note cards
    notesGrid.innerHTML = notes.map(note => `
        <div class="card note-card fade-in">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-sticky-note"></i>
                    <span>${escapeHtml(note.title)}</span>
                </h3>
            </div>
            <div class="card-body">
                <p class="card-text">
                    ${truncateText(escapeHtml(note.content), 150)}
                </p>
                
                ${note.tags?.length > 0 ? `
                    <div class="tags">
                        ${note.tags.map(tag => `
                            <span class="tag">
                                <i class="fas fa-tag"></i>
                                ${escapeHtml(tag)}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <div class="note-meta">
                    <span class="author">
                        <i class="fas fa-user"></i>
                        ${note.author ? escapeHtml(note.author.username) : 'Unknown'}
                    </span>
                    <span class="date">
                        <i class="far fa-calendar-alt"></i>
                        ${formatDate(note.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility Functions

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncates text to a specified length and adds ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Formats a date string into a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// User Operations

/**
 * Populates the author dropdown in the create note form
 * @param {Array} users - Array of user objects
 */
function populateAuthorDropdown(users) {
    const authorSelect = document.getElementById('noteAuthor');
    if (!authorSelect) return;
    
    // Clear existing options except the first one
    authorSelect.innerHTML = '<option value="" disabled selected>Select an author</option>';
    
    // Add users to the dropdown
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.username} (${user.email})`;
        authorSelect.appendChild(option);
    });
}

/**
 * Creates a new note
 * @param {Event} event - Form submission event
 */
async function createNote(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('createNoteForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const authorId = formData.get('authorId');
    const title = formData.get('noteTitle');
    const content = formData.get('noteContent');
    const tags = (formData.get('noteTags') || '').split(',').map(tag => tag.trim()).filter(Boolean);
    
    if (!authorId || !title || !content) {
        showResponse('Please fill in all required fields', true);
        return;
    }
    
    const query = `
        mutation CreateNote($input: CreateNoteInput!) {
            createNote(input: $input) {
                id
                title
                content
                tags
                author {
                    username
                }
                createdAt
            }
        }
    `;

    try {
        const { createNote } = await graphqlRequest(query, {
            input: { 
                title, 
                content, 
                tags: tags.length > 0 ? tags : undefined,
                authorId 
            }
        });
        
        showResponse('Note created successfully! 📝');
        
        // Reset form
        const form = document.getElementById('createNoteForm');
        if (form) form.reset();
        
        // Refresh notes grid
        await fetchNotes();
        
    } catch (error) {
        console.error('Error creating note:', error);
        // Error is already shown by graphqlRequest
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up form submissions
    const forms = {
        'createUserForm': createUser,
        'createNoteForm': createNote,
        'updateNoteForm': updateNote,
        'deleteNoteForm': deleteNote,
        'searchForm': searchByTag
    };
    
    // Add event listeners to all forms
    Object.entries(forms).forEach(([formId, handler]) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', handler);
        } else {
            console.warn(`Form with ID '${formId}' not found`);
        }
    });
    
    // Set up refresh buttons
    document.querySelectorAll('.refresh-btn').forEach(btn => {
        const gridId = btn.closest('.grid-section').querySelector('.grid-container').id;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (gridId === 'usersGrid') fetchUsers();
            if (gridId === 'notesGrid') fetchNotes();
        });
    });
    
    // Load initial data and populate author dropdown
    fetchUsers().then(users => {
        if (users && users.length > 0) {
            usersCache = users;
            populateAuthorDropdown(usersCache);
        }
    });
    fetchNotes();
});

/**
 * Search for notes by tag
 * @param {string} tag - The tag to search for
 */
async function searchByTag(event) {
    if (event) event.preventDefault();
    
    const tagInput = document.getElementById('searchTag');
    if (!tagInput) return;
    
    const tag = tagInput.value.trim();
    if (!tag) {
        showResponse('Please enter a tag to search', true);
        return;
    }
    
    const query = `
        query SearchByTag($tag: String!) {
            notesByTag(tag: $tag) {
                id
                title
                content
                tags
                author {
                    id
                    username
                }
                createdAt
                updatedAt
            }
        }
    `;

    try {
        const { data } = await graphqlRequest(query, { tag });
        if (data && data.notesByTag) {
            if (data.notesByTag.length === 0) {
                notesGrid.innerHTML = '<p>No notes found with tag: ' + tag + '</p>';
            } else {
                renderNotes(data.notesByTag);
                showResponse('Found ' + data.notesByTag.length + ' note(s) with tag: ' + tag);
            }
        }
    } catch (error) {
        console.error('Error searching by tag:', error);
        notesGrid.innerHTML = '<p style="color: red">Error searching notes. Please try again.</p>';
        showResponse('Error: ' + error.message, true);
    }
}

async function updateNote() {
    const id = document.getElementById('updateNoteId').value.trim();
    const title = document.getElementById('updateTitle').value.trim();
    const content = document.getElementById('updateContent').value.trim();
    const tagsInput = document.getElementById('updateTags').value.trim();
    
    if (!id) {
        showResponse('Please enter a note ID', true);
        return;
    }
    
    if (!title && !content && !tagsInput) {
        showResponse('Please provide at least one field to update', true);
        return;
    }
    
    const updateInput = { id };
    if (title) updateInput.title = title;
    if (content) updateInput.content = content;
    if (tagsInput) {
        updateInput.tags = tagsInput
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    const query = `
        mutation UpdateNote($id: ID!, $input: UpdateNoteInput!) {
            updateNote(id: $id, input: $input) {
                id
                title
                content
                tags
                author {
                    id
                    username
                }
                createdAt
                updatedAt
            }
        }
    `;

    try {
        const { data } = await graphqlRequest(query, {
            id,
            input: updateInput
        });
        
        if (data && data.updateNote) {
            showResponse('Note updated successfully!');
            
            // Clear the update form
            document.getElementById('updateNoteId').value = '';
            document.getElementById('updateTitle').value = '';
            document.getElementById('updateContent').value = '';
            document.getElementById('updateTags').value = '';
            
            // Refresh both notes and users to reflect any changes
            fetchNotes();
            fetchUsers();
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showResponse('Error: ' + error.message, true);
    }
}

async function deleteNote() {
    const id = document.getElementById('deleteNoteId').value.trim();
    
    if (!id) {
        showResponse('Please enter a note ID', true);
        return;
    }
    
    // Ask for confirmation before deleting
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    const query = `
        mutation DeleteNote($id: ID!) {
            deleteNote(id: $id) {
                id
                title
                author {
                    id
                }
            }
        }
    `;

    try {
        const { data } = await graphqlRequest(query, { id });
        
        if (data && data.deleteNote) {
            showResponse('Note deleted successfully!');
            
            // Clear the delete form
            document.getElementById('deleteNoteId').value = '';
            
            // Refresh both notes and users to reflect the deletion
            fetchNotes();
            fetchUsers();
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showResponse('Error: ' + error.message, true);
    }
}
