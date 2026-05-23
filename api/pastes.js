const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage
const pastes = new Map();

// Create a new paste
app.post('/api/pastes', (req, res) => {
  const { title, content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const id = Math.random().toString(36).substring(2, 10);
  const createdAt = Date.now();
  
  const paste = {
    id,
    title: title || 'Untitled',
    content,
    createdAt,
    updatedAt: createdAt,
    views: 0
  };
  
  pastes.set(id, paste);
  
  res.json({
    success: true,
    id,
    url: `https://${req.headers.host}/p/${id}`,
    shareUrl: `https://${req.headers.host}/raw/${id}`
  });
});

// Get a paste
app.get('/api/pastes/:id', (req, res) => {
  const { id } = req.params;
  const paste = pastes.get(id);
  
  if (!paste) {
    return res.status(404).json({ error: 'Paste not found' });
  }
  
  paste.views++;
  pastes.set(id, paste);
  
  const { content, ...pasteWithoutContent } = paste;
  res.json(pasteWithoutContent);
});

// Get full content
app.get('/api/pastes/:id/content', (req, res) => {
  const { id } = req.params;
  const paste = pastes.get(id);
  
  if (!paste) {
    return res.status(404).json({ error: 'Paste not found' });
  }
  
  res.json({ content: paste.content });
});

// Raw content
app.get('/api/raw/:id', (req, res) => {
  const { id } = req.params;
  const paste = pastes.get(id);
  
  if (!paste) {
    return res.status(404).send('Paste not found');
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.send(paste.content);
});

// Update a paste
app.put('/api/pastes/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const paste = pastes.get(id);
  
  if (!paste) {
    return res.status(404).json({ error: 'Paste not found' });
  }
  
  if (title) paste.title = title;
  if (content) paste.content = content;
  paste.updatedAt = Date.now();
  
  pastes.set(id, paste);
  
  res.json({ success: true });
});

// Delete a paste
app.delete('/api/pastes/:id', (req, res) => {
  const { id } = req.params;
  
  if (!pastes.has(id)) {
    return res.status(404).json({ error: 'Paste not found' });
  }
  
  pastes.delete(id);
  res.json({ success: true });
});

// List recent pastes
app.get('/api/pastes', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const recent = Array.from(pastes.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(p => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt,
      views: p.views
    }));
  
  res.json(recent);
});

module.exports = app;
