import express from 'express';
import multer from 'multer';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import Author from '../models/Author.js';
import mailer from '../helpers/mailer.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all authors
router.get('/', async (req, res) => {
  try {
    const authors = await Author.find();
    res.status(200).json(authors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single author by ID
router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.status(200).json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new author
router.post('/', uploadCloudinary.single('avatar'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.profile = req.file.path;
    }
    
    const newAuthor = await Author.create(data);
    
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: req.body.email,
      subject: 'Benvenuto in Epicode!',
      text: `Ciao ${newAuthor.name}, benvenuto in Epicode! Siamo felici di averti con noi.`,
      html: `<h1>Ciao ${newAuthor.name}!</h1><p>Benvenuto in Epicode! Siamo felici di averti con noi.</p>`
    });

    res.status(201).json(newAuthor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (update) an author by ID
router.put('/:id', uploadCloudinary.single('avatar'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.profile = req.file.path;
    }
    
    const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!updatedAuthor) return res.status(404).json({ message: 'Author not found' });
    res.status(200).json(updatedAuthor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an author by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedAuthor = await Author.findByIdAndDelete(req.params.id);
    if (!deletedAuthor) return res.status(404).json({ message: 'Author not found' });
    res.status(200).json({ message: 'Author deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /authors/:id/avatar
// router.patch('/:id/avatar', uploadCloudinary.single('avatar'), async (req, res) => {
//   try {
//     console.log('Richiesta ricevuta per aggiornare avatar');
//     console.log('AuthorId:', req.params.id);
//     console.log('File:', req.file);

//     const { id } = req.params;
    
//     if (!req.file) {
//       return res.status(400).json({ message: 'Nessun file caricato' });
//     }

//     const updatedAuthor = await Author.findByIdAndUpdate(
//       id,
//       { profile: req.file.path },
//       { new: true }
//     );

//     if (!updatedAuthor) {
//       return res.status(404).json({ message: 'Autore non trovato' });
//     }

//     console.log('Autore aggiornato:', updatedAuthor);
//     res.json(updatedAuthor);
//   } catch (error) {
//     console.error('Errore durante l\'aggiornamento dell\'avatar:', error);
//     res.status(500).json({ 
//       message: 'Errore durante l\'aggiornamento dell\'avatar',
//       error: error.message 
//     });
//   }
// });

export default router;