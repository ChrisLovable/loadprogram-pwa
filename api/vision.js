const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });

    const prompt = `You are an expert at reading scanned delivery documents. Focus ONLY on the very top left of the document. Ignore all other text. Extract the full handwritten line after the label 'SENDER:' and the full handwritten line after the label 'RECEIVER:'. These may be two words or more. Return as JSON: { sender: ..., receiver: ... }. If you cannot find the label or handwriting, return null for that field. Also, return the raw OCR text as 'raw_text' for debugging. Be robust to faint, slanted, or cursive handwriting. Do not guess, only extract what is clearly present after the labels.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageData}` } }
            ]
          }
        ],
        max_tokens: 700
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    fs.unlinkSync(imagePath); // Clean up uploaded file

    // Try to parse JSON from the response
    const text = response.data.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    } catch {
      result = { raw: text };
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('OpenAI Vision backend running on http://localhost:3001');
});
