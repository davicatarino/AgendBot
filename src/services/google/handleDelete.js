import { oauth2Client } from '../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import axios from 'axios';
import config from '../../config/index.js';
config(); // Configura as variáveis de ambiente

export async function handleDelete(req, res) {
  // Extração correta do EventID
  const { EventID: eventId } = req.body;

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('Dados recebidos para deleção:', req.body);

    // Verifica se o EventID foi passado
    if (!eventId) {
      return res.status(404).send({
        message: 'Event ID não encontrado no ManyChat para o usuário especificado.',
      });
    }

    // Deletar o evento do Google Calendar
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId, // Usa o eventId passado no corpo da requisição
    });

    console.log(`Evento deletado com sucesso: ${eventId}`);

    // Retorna sucesso
    res.status(200).send({
      message: 'Evento deletado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).send({
      message: 'Erro ao deletar evento.',
      error: error.message,
    });
  }
}
