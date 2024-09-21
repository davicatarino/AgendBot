import { Router } from 'express';
import { handleChat } from '../services/openAi/handleChat.js';
import {
  auth,
  redirect,
  oauth2Client,
  refreshToken,
} from '../services/auth/autheticationGoogle.js';
import { handleAvailable } from '../services/google/HandleAvailable.js';
import { handleEvent } from '../services/google/handleEvent.js';
import { handleDelete } from '../services/google/handleDelete.js';

const router = Router();

router.post('/Julia', handleChat);
router.get('/google', auth);
router.post('/event', handleEvent);
router.post('/eventDelete', handleDelete);
router.get('/redirect', redirect);
router.get('/freebusy', async (req, res) => {
  // Verifique e renove o token se necessário
  if (!oauth2Client.credentials || oauth2Client.credentials.expiry_date < Date.now()) {
    await refreshToken(); // Renova o token se estiver expirado
  }

  // Chame a função handleAvailable para processar a solicitação
  handleAvailable(req, res);
});


export default router;
