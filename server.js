const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;
client.connect(err => {
  if (err) throw err;
  db = client.db(process.env.MONGODB_DBNAME);
  console.log('Connected to MongoDB');
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection('users').findOne({ username, password });
  if (user) {
    res.status(200).json({ message: 'Login successful', user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await db.collection('users').findOne({ username });
  if (existingUser) {
    res.status(409).json({ message: 'Username already exists' });
  } else {
    await db.collection('users').insertOne({ username, password });
    res.status(201).json({ message: 'User created' });
  }
});

app.post('/api/notes', async (req, res) => {
  const { title, content, userId } = req.body;
  const newNote = { title, content, userId, createdAt: new Date() };
  await db.collection('notes').insertOne(newNote);
  res.status(201).json({ message: 'Note created', note: newNote });
});

app.get('/api/notes/:userId', async (req, res) => {
  const { userId } = req.params;
  const notes = await db.collection('notes').find({ userId }).toArray();
  res.status(200).json(notes);
});

app.put('/api/notes/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { title, content } = req.body;
  await db.collection('notes').updateOne({ _id: noteId }, { $set: { title, content } });
  res.status(200).json({ message: 'Note updated' });
});

app.delete('/api/notes/:noteId', async (req, res) => {
  const { noteId } = req.params;
  await db.collection('notes').deleteOne({ _id: noteId });
  res.status(200).json({ message: 'Note deleted' });
});