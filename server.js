
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'taskpane.html'));
});


app.get('/taskpane.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'taskpane.html'));
  });
  
  app.get('/commands.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'commands.html'));
  });

  
  

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
