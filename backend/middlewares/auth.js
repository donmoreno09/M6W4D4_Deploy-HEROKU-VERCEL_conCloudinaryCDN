import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Verifica se c'è l'header Authorization e se è di tipo Bearer
    if (!req.headers.authorization) return res.status(401).json({ message: 'Autenticazione richiesta' });
    
    const parts = req.headers.authorization.split(' ');
    if (parts.length !== 2) return res.status(401).json({ message: 'Formato token non valido' });
    if (parts[0] !== 'Bearer') return res.status(401).json({ message: 'Formato token non valido' });
    
    const token = parts[1];
    
    // Verifica la firma del token
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      // Errore: probabilmente il token è stato manomesso
      if (err) return res.status(401).json({ message: 'Token non valido' });
      
      // Recupera i dati dell'utente dal database
      const user = await User.findById(payload.userId).select('-password');
      
      // L'utente potrebbe aver eliminato l'account nel frattempo
      if (!user) return res.status(401).json({ message: 'Utente non trovato' });
      
      // Aggiungiamo l'utente alla request per i middleware successivi
      req.user = user;
      
      // Passa al prossimo middleware
      next();
    });
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

export default auth;