require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/agent', async (req, res) => {
  const { message, history } = req.body;

  try {
    const messages = [
      {
        role: 'system',
        content: `Tu es NedwirAgent, un agent autonome de recherche d'emploi pour les jeunes marocains.
Tu aides les utilisateurs à :
1. Trouver des offres d'emploi adaptées à leur profil au Maroc (Rekrute, Indeed Maroc, Emploi.ma)
2. Améliorer et optimiser leur CV
3. Préparer leurs entretiens avec des questions simulées
4. Rédiger des lettres de motivation personnalisées
5. Conseiller sur les compétences à acquérir selon leur domaine
Tu réponds en français ou en darija selon la langue de l'utilisateur.
Tu es professionnel, encourageant, précis et toujours orienté vers l'action.
Quand tu listes des offres, donne toujours : entreprise, poste, ville.`
      },
      ...(history || []).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
      })),
      { role: 'user', content: message }
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;
    res.json({ success: true, message: reply });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 NedwirAgent lancé sur le port ${PORT}`);
});