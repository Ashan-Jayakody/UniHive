const express = require('express');
const cors = require('cors');
const threadRoutes = require('./routes/threadRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// your routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/threads', threadRoutes);

app.get('/', (req, res) => {
  res.send('UniHive backend is running');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});