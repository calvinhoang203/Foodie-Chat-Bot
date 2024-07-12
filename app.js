const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Serve index.html on the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let history = [];

app.post('/chat', (req, res) => {
  const userInput = req.body.message;
  console.log(`User input: ${userInput}`);

  const pythonProcess = spawn('python', ['app.py', userInput, JSON.stringify(history)]);
  let outputData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stdout.on('end', () => {
    try {
      const response = JSON.parse(outputData);
      history = response.history;
      res.json({ reply: response.reply });
    } catch (e) {
      console.error(`Error parsing Python response: ${e}`);
      res.status(500).send('Error parsing response from Python script');
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data.toString()}`);
    if (!res.headersSent) {
      res.status(500).send(data.toString());
    }
  });

  pythonProcess.on('close', (code) => {
    if (!res.headersSent) {
      res.json({ reply: outputData.trim() });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

