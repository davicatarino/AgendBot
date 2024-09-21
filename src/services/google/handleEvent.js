// services/google/handleEvent.js
import { oauth2Client } from '../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';
import updateManyChatCustomField from '../manychat/manyChatset.js'; // Importa a função para atualizar o ManyChat

/**
 * Cria um evento no Google Calendar.
 * @param {Object} args - Argumentos para criar o evento.
 * @returns {Object} Resultado da criação do evento ou erro.
 */
export async function handleEvent(args) {
  const { Name, ManyChatID, Email, Horario, Modelo } = args;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  let location;
  let conferenceData = null;

  if (Modelo === 'Presencial') {
    location = "Presencialmente no endereço: XXXXXXXXXXXXXXXXXXX";
  } else if (Modelo === 'On-line') {
    location = "Reunião online no Google Meet";
    conferenceData = {
      createRequest: {
        requestId: `meet_${ManyChatID}_${Date.now()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        }
      }
    };
  }

  function addOneHourToISO(isoString) {
    const dateTime = moment.utc(isoString);
    dateTime.add(1, 'hours');
    return dateTime.toISOString();
  }

  const newHour = addOneHourToISO(Horario);

  const event = {
    summary: Name,
    description: 'Reunião agendada pela Alice IA.',
    start: {
      dateTime: Horario,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: newHour,
      timeZone: 'America/Sao_Paulo',
    },
    attendees: [
      { email: 'paulo.motta@v4company.com' }, // Altere conforme necessário
      { email: Email }
    ],
    reminders: {
      useDefault: true,
    },
    location: location,
    conferenceData: conferenceData
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    const eventId = response.data.id;
    await updateManyChatCustomField(ManyChatID, eventId, null, null, null, null);

    return {
      message: 'Evento criado com sucesso',
      event: response.data,
    };
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw new Error('Erro ao criar evento: ' + error.message);
  }
}
