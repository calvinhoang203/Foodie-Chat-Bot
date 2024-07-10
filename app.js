const express = require('express'); // Import Express framework
const bodyParser = require('body-parser'); // Import body-parser to parse request bodies
const { spawn } = require('child_process'); // Import child_process to spawn Python processes
require('dotenv').config(); // Load environment variables from .env file

const app = express(); // Create an Express application
const port = 3000; // Port number

app.use(bodyParser.json()); // Use body-parser middleware to parse JSON request bodies
app.use(express.static('public')); // Serve static files from the 'public' directory

let history = []; // Initialize an empty array to store conversation history

// Define a POST endpoint at /chat
app.post('/chat', (req, res) => {
  const userInput = req.body.message; // Extract the user input from the request body
  console.log(`User input: ${userInput}`);

  // Spawn a Python process to handle the user input and conversation history
  const pythonProcess = spawn('python', ['app.py', userInput, JSON.stringify(history)]);
  let outputData = '';

  // Collect data from the Python process stdout
  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  // When the Python process ends, process the collected data
  pythonProcess.stdout.on('end', () => {
    const outputLines = outputData.split('\n');
    const responseLines = [];
    let newHistory = [];
    for (let line of outputLines) {
      if (line.includes('===END===')) {
        break;
      }
      responseLines.push(line);
    }
    for (let line of outputLines) {
      try {
        newHistory = JSON.parse(line);
        break;
      } catch (e) {
        // not a valid JSON, continue
      }
    }
    const finalResponse = responseLines.join('\n').trim();

    history = newHistory; // Update the conversation history

    res.json({ reply: finalResponse }); // Send the final response back to the client
  });

  // Handle errors from the Python process
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data.toString()}`);
    if (!res.headersSent) {
      res.status(500).send(data.toString());
    }
  });

  // Handle the close event of the Python process
  pythonProcess.on('close', (code) => {
    if (!res.headersSent) {
      res.json({ reply: outputData.trim() });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
