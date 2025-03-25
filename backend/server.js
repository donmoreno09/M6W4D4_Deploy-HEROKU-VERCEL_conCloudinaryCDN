import 'dotenv/config'; // carica il file .env
import cors from 'cors';
import mongoose from 'mongoose';
import express from 'express';
import authorRoutes from './routes/authors.js';
import blogRoutes from './routes/blogs.js';
import userRoutes from './routes/users.js';
import oAuthRoutes from './routes/oauths.js';
import googleStrategy from './config/passport.js';
import passport from 'passport';

// Verifica che JWT_SECRET sia impostato
if (!process.env.JWT_SECRET) {
  console.error('ERRORE: JWT_SECRET non definito nel file .env');
  process.exit(1);
}

const server = express(); // creato il server base

server.use(cors()); // serve a risolvere i problemi di CORS quando si collega l'api con il frontend


passport.use(googleStrategy); 

server.use(express.json()); // serve ad accettare json nel body delle richieste

//URL
server.use("/authors", authorRoutes);
server.use("/blogs", blogRoutes);
server.use("/users", userRoutes);
server.use("/auths", oAuthRoutes);

await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Database connesso'))
    .catch((err) => console.log(err));

server.listen(process.env.PORT, () => {
    // console.clear();
    console.log('Server avviato sulla porta ' + process.env.PORT);
});