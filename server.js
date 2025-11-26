
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`Serving static files from ${distPath}`);
  try {
    const files = fs.readdirSync(distPath);
    console.log(`Files in dist: ${files.join(', ')}`);
  } catch (e) {
    console.error('Error reading dist directory:', e);
  }
} else {
  console.error(`DIST DIRECTORY NOT FOUND at ${distPath}`);
}

app.use(express.static(distPath));

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
