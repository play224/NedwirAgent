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
  const { message, history, profil } = req.body;

  const profilContext = profil ? `
Profil de l'utilisateur :
- Nom : ${profil.nom}
- Niveau d'études : ${profil.niveau}
- Domaine : ${profil.domaine}
- Compétences : ${profil.competences}
- Ville : ${profil.ville}
` : '';

  try {
    const messages = [
      {
        role: 'system',
        content: `Tu es NedwirAgent, un agent IA autonome de recherche d'emploi pour les jeunes marocains.
${profilContext}

Tu aides les utilisateurs à :
1. Trouver des offres d'emploi et stages adaptés à leur profil au Maroc
2. Améliorer et optimiser leur CV avec des conseils précis
3. Préparer leurs entretiens avec des questions simulées et des réponses modèles
4. Rédiger des lettres de motivation personnalisées et professionnelles
5. Conseiller sur les compétences à acquérir selon leur domaine

Règles de réponse :
- Toujours structurer tes réponses avec des sections claires
- Utiliser des émojis pour rendre la réponse lisible
- Donner des exemples concrets adaptés au marché marocain
- Mentionner des entreprises marocaines réelles : OCP, Maroc Telecom, CIH Bank, Attijariwafa, Inwi, ONCF, RAM
- Mentionner des plateformes : Rekrute.com, Indeed Maroc, Emploi.ma
- Répondre en français ou en darija selon la langue de l'utilisateur
- Toujours terminer par une question pour continuer l'accompagnement
- Être encourageant, professionnel et orienté vers l'action`
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
      max_tokens: 1500,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;
    res.json({ success: true, message: reply });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 NedwirAgent lancé sur http://localhost:3000`);
});