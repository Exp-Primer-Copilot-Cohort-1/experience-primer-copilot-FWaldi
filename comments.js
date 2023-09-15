// Create web server
// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create web server
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments database
const commentsByPostId = {};

// Get comments by post id
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create comments
app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;
  // Get comments array from commentsByPostId
  const comments = commentsByPostId[req.params.id] || [];
  // Push new comment to comments array
  comments.push({ id: commentId, content, status: 'pending' });
  // Set comments array to commentsByPostId
  commentsByPostId[req.params.id] = comments;
  // Emit event
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });
  // Send response
  res.status(201).send(comments);
});

// Receive event
app.post('/events', async (req, res) => {
  console.log('Event Received:', req.body.type);
  const { type, data } = req.body;
  // Check event type
  if (type === 'CommentModerated') {
    // Get comments array from commentsByPostId
    const comments = commentsByPostId[data.postId];
    // Find comment to update
    const comment = comments.find((comment) => {
      return comment.id === data.id;
    });
    // Update comment
    comment.status = data.status;
    // Emit event
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
        id: data.id,
        status: data.status,
        postId: data.postId,
        content: data.content,
      },
    });
  }
  // Send response
  res.send({});
});

// Listen on port 4001
app