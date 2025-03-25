import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import auth from '../middlewares/auth.js';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import mailer from '../helpers/mailer.js';

const router = express.Router();

// GET all users - richiede autenticazione
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /me - ottiene l'utente collegato al token
router.get('/me', auth, async (req, res) => {
    try {
        // req.user è già disponibile grazie al middleware auth
        res.status(200).json(req.user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single user - richiede autenticazione
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: 'Utente non trovato' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST register - registrazione con password criptata
router.post('/register', uploadCloudinary.single('avatar'), async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        // Verifica se l'email esiste già
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email già registrata" });
        }

        // Cripta la password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const data = { 
            firstName, 
            lastName, 
            email, 
            password: hashedPassword // Password criptata
        };
        
        // Aggiungi avatar se caricato
        if (req.file) {
            data.avatar = req.file.path;
        }

        const newUser = await User.create(data);
        
        // Invio email di benvenuto - Manteniamo questa funzionalità esistente
        await mailer.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Benvenuto nella nostra piattaforma!',
            text: `Ciao ${firstName}, benvenuto nella nostra piattaforma! Siamo felici di averti con noi.`,
            html: `<h1>Ciao ${firstName}!</h1><p>Benvenuto nella nostra piattaforma! Siamo felici di averti con noi.</p>`
        });

        // Non inviare la password nella risposta
        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;
        
        res.status(201).json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST login - restituisce token di accesso
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Trova l'utente per email
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }
        
        // Verifica la password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        // Genera il token JWT
        jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('Errore nella generazione del token:', err);
                    return res.status(500).json({ message: 'Errore durante il login' });
                }
                
                // Non inviare la password nella risposta
                const userWithoutPassword = user.toObject();
                delete userWithoutPassword.password;
                
                // Ritorna il token e i dati utente
                return res.json({
                    token,
                    user: userWithoutPassword
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update user - richiede autenticazione
router.put('/:id', auth, uploadCloudinary.single('avatar'), async (req, res) => {
    try {
        // Verifica che l'utente stia modificando il proprio profilo o sia un admin
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Non sei autorizzato a modificare questo profilo" });
        }

        const { firstName, lastName, email, role, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        // Verifica password attuale se si sta tentando di cambiarla
        if (newPassword) {
            // Utilizza bcrypt per verificare la password attuale
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Password attuale non corretta" });
            }
            
            // Cripta la nuova password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Aggiorna i campi solo se forniti
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (role) user.role = role;

        // Aggiorna l'avatar se caricato
        if (req.file) {
            user.avatar = req.file.path;
        }

        await user.save();

        // Non inviare la password nella risposta
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE user - richiede autenticazione
router.delete('/:id', auth, async (req, res) => {
    try {
        // Verifica che l'utente stia eliminando il proprio profilo o sia un admin
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Non sei autorizzato a eliminare questo utente" });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'Utente non trovato' });
        res.status(200).json({ message: 'Utente eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
