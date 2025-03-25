import express from 'express';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import Blog from '../models/Blog.js';
import auth from '../middlewares/auth.js';
import mailer from '../helpers/mailer.js';

const router = express.Router();

// Route pubbliche (accessibili a tutti)

// GET all blogs - pubblico
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // Se c'è un parametro author, filtra i blog per autore
    const filter = req.query.author ? { author: req.query.author } : {};

    const totalBlogs = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(totalBlogs / limit);

    const blogs = await Blog.find(filter)
      .populate('author', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      blogs,
      currentPage: page,
      totalPages,
      totalBlogs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IMPORTANTE: Metti le rotte specifiche PRIMA delle rotte con parametri!
// GET blogs dell'utente corrente - protetto
router.get('/my-blogs', auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ blogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single blog by ID - pubblico
// Deve venire DOPO le rotte specifiche
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route protette (richiedono autenticazione)

// ============ ROTTE PER I COMMENTI ============
// NOTA: Tutte le rotte specifiche devono essere definite PRIMA delle rotte parametriche

/**
 * GET /blogs/:id/comments - Ottieni tutti i commenti di un blog specifico
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .select('comments')
      .populate('comments.author', 'firstName lastName');

    if (!blog) {
      return res.status(404).json({ message: 'Blog non trovato' });
    }

    res.status(200).json(blog.comments || []);
  } catch (err) {
    console.error('Errore nel recupero dei commenti:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /blogs/:id/comments/:commentId - Ottieni un commento specifico
 */
router.get('/:id/comments/:commentId', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .select('comments')
      .populate('comments.author', 'firstName lastName');

    if (!blog) {
      return res.status(404).json({ message: 'Blog non trovato' });
    }

    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Commento non trovato' });
    }

    res.status(200).json(comment);
  } catch (err) {
    console.error('Errore nel recupero del commento:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /blogs/:id/comments - Aggiungi un nuovo commento
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { content, author } = req.body;

    if (!content || !author) {
      return res.status(400).json({ message: 'Contenuto e autore sono richiesti' });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog non trovato' });
    }

    // Aggiungi il nuovo commento
    blog.comments = blog.comments || []; // Assicura che l'array commenti esista
    blog.comments.push({
      content,
      author
    });

    // Salva il blog aggiornato
    const updatedBlog = await blog.save();

    // Trova e popola il commento appena aggiunto
    const newComment = await Blog.findById(blog._id)
      .select('comments')
      .populate('comments.author', 'firstName lastName');

    const latestComment = newComment.comments[newComment.comments.length - 1];

    res.status(201).json(latestComment);
  } catch (err) {
    console.error('Errore nell\'aggiunta del commento:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /blogs/:id/comments/:commentId - Modifica un commento
 */
router.put('/:id/comments/:commentId', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Il contenuto è richiesto' });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog non trovato' });
    }

    // Trova il commento da modificare
    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Commento non trovato' });
    }

    // Aggiorna il commento
    comment.content = content;

    // Salva le modifiche
    await blog.save();

    // Trova e popola il commento aggiornato
    const updatedBlog = await Blog.findById(req.params.id)
      .select('comments')
      .populate('comments.author', 'firstName lastName');

    const updatedComment = updatedBlog.comments.id(req.params.commentId);

    res.status(200).json(updatedComment);
  } catch (err) {
    console.error('Errore nella modifica del commento:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /blogs/:id/comments/:commentId - Elimina un commento
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog non trovato' });
    }

    // Trova il commento da eliminare
    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Commento non trovato' });
    }

    // Rimuovi il commento e salva
    comment.deleteOne();
    await blog.save();

    res.status(200).json({ message: 'Commento eliminato con successo' });
  } catch (err) {
    console.error('Errore nell\'eliminazione del commento:', err);
    res.status(500).json({ error: err.message });
  }
});
// ============ FINE ROTTE PER I COMMENTI ============

// POST a new blog - protetto
router.post('/', auth, uploadCloudinary.single('cover'), async (req, res) => {
  try {
    // Imposta l'autore come l'utente autenticato
    req.body.author = req.user._id;

    const { title, category, content, readTime, author } = req.body;

    // Validazione dei dati
    if (!title || !category || !content || !author || !req.file) {
      return res.status(400).json({
        message: "Tutti i campi sono obbligatori"
      });
    }

    // Parse readTime da stringa a oggetto JSON
    const parsedReadTime = JSON.parse(readTime);

    const newBlog = new Blog({
      title,
      category,
      cover: req.file.path, // Usa il path del file caricato su Cloudinary
      content,
      readTime: parsedReadTime,
      author,
      comments: [] // Inizializza l'array dei commenti vuoto
    });

    const savedBlog = await newBlog.save();

    // Popola i dati dell'autore prima di inviare la risposta
    const populatedBlog = await Blog.findById(savedBlog._id)
      .populate('author', 'firstName lastName email'); // Assicurati che l'email sia inclusa

    // Invia una mail all'autore
    const authorData = populatedBlog.author;
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: authorData.email, // Email dell'autore
      subject: 'Il tuo nuovo post è stato pubblicato!',
      text: `Ciao ${authorData.firstName}, il tuo post "${newBlog.title}" è stato pubblicato con successo!`,
      html: `<h1>Ciao ${authorData.firstName}!</h1><p>Il tuo post "<strong>${newBlog.title}</strong>" è stato pubblicato con successo!</p>`
    });

    res.status(201).json(populatedBlog);
  } catch (err) {
    console.error('Errore server:', err);
    res.status(500).json({
      message: "Errore durante il salvataggio del blog",
      error: err.message
    });
  }
});

// PUT update blog - protetto
router.put('/:id', auth, uploadCloudinary.single('cover'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog non trovato' });

    // Verifica che l'utente sia l'autore del blog
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Non sei autorizzato a modificare questo blog' });
    }

    const data = { ...req.body };

    // Se c'è un file caricato, usa il suo path
    if (req.file) {
      data.cover = req.file.path;
    }

    // Se readTime è una stringa JSON, parseAmela
    if (data.readTime && typeof data.readTime === 'string') {
      try {
        data.readTime = JSON.parse(data.readTime);
      } catch (e) {
        console.error('Errore nel parsing del readTime:', e);
      }
    }

    // Trova il blog esistente
    const existingBlog = await Blog.findById(req.params.id);
    if (!existingBlog) {
      return res.status(404).json({ message: 'Blog non trovato' });
    }

    // Aggiorna il blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    ).populate('author', 'firstName lastName');

    res.status(200).json(updatedBlog);
  } catch (err) {
    console.error('Errore durante l\'aggiornamento del blog:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE blog - protetto
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog non trovato' });

    // Verifica che l'utente sia l'autore del blog
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Non sei autorizzato a eliminare questo blog' });
    }

    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) return res.status(404).json({ message: 'Blog not found' });
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;