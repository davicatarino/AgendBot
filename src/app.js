import express from 'express';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
app.use(express.json()); // Middleware para parsear JSON
app.use('/chat', chatRoutes); // Usa as rotas de chat

export default app;
