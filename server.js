const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin using Environment Variable for security
// On Render, add a Secret File or Environment Variable named FIREBASE_SERVICE_ACCOUNT
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// 1. Save/Update User Profile (Worldwide)
app.post('/api/sync', async (req, res) => {
  const { email, password, avatar, eggs, username } = req.body;

  if (!email) return res.status(400).send({ error: 'Email is required' });

  try {
    // We use the email as the unique document ID for simplicity in this arcade setup
    const userRef = db.collection('arcade_users').doc(email.toLowerCase());
    
    await userRef.set({
      email: email.toLowerCase(),
      password: password, // Note: In production, passwords should be hashed
      avatar: avatar,
      eggs: parseInt(eggs) || 0,
      username: username,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).send({ message: 'Synced worldwide!' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// 2. Login/Fetch Global Data
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const doc = await db.collection('arcade_users').doc(email.toLowerCase()).get();
    if (!doc.exists) return res.status(404).send({ error: 'User not found' });
    
    const data = doc.data();
    if (data.password !== password) return res.status(401).send({ error: 'Wrong password' });
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));