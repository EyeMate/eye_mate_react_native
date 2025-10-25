// Example Node.js web API for AssemblyAI integration
// Deploy this to a service like Vercel, Netlify, or Heroku

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { AssemblyAI } = require('assemblyai');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || 'c352cbddc97548f9a1b85d6baec12639',
});

// Enable CORS for React Native app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Voice-to-Text API is running' });
});

// Transcribe audio endpoint
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', req.file.originalname);
    
    // Upload audio to AssemblyAI
    const audioUrl = await uploadAudioToAssemblyAI(req.file.path);
    
    // Start transcription
    const transcript = await client.transcripts.transcribe({
      audio: audioUrl,
      language_code: 'fr', // French language
      punctuate: true,
      format_text: true,
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      transcript: transcript.text,
      confidence: transcript.confidence,
      language: transcript.language_code,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Transcription failed',
      message: error.message,
    });
  }
});

// Upload audio file to a temporary URL (you can use any file hosting service)
async function uploadAudioToAssemblyAI(filePath) {
  // For this example, we'll use a simple approach
  // In production, you should upload to a cloud storage service like AWS S3, Google Cloud Storage, etc.
  
  // Read the file and convert to base64
  const audioBuffer = fs.readFileSync(filePath);
  const base64Audio = audioBuffer.toString('base64');
  
  // Return a data URL (AssemblyAI accepts data URLs)
  return `data:audio/wav;base64,${base64Audio}`;
}

// Streaming transcription endpoint (for real-time)
app.post('/transcribe-stream', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Starting streaming transcription...');
    
    const audioBuffer = fs.readFileSync(req.file.path);
    const base64Audio = audioBuffer.toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64Audio}`;

    // Start streaming transcription
    const transcriber = client.streaming.transcriber({
      sampleRate: 16000,
      formatTurns: true
    });

    let transcriptText = '';

    transcriber.on('open', ({ id }) => {
      console.log(`Streaming session opened: ${id}`);
    });

    transcriber.on('turn', (turn) => {
      if (turn.transcript) {
        transcriptText += ' ' + turn.transcript;
        console.log('Turn transcript:', turn.transcript);
      }
    });

    transcriber.on('close', (code, reason) => {
      console.log('Streaming session closed:', code, reason);
    });

    transcriber.on('error', (error) => {
      console.error('Streaming error:', error);
    });

    await transcriber.connect();
    
    // Send audio data to the stream
    const audioStream = require('stream').Readable.from(audioBuffer);
    audioStream.pipe(transcriber.stream());

    // Wait for transcription to complete
    setTimeout(async () => {
      await transcriber.close();
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        transcript: transcriptText.trim(),
        method: 'streaming'
      });
    }, 5000); // Wait 5 seconds for processing

  } catch (error) {
    console.error('Streaming transcription error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Streaming transcription failed',
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Voice-to-Text API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;
