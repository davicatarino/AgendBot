import { oauth2Client } from '../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';
import updateManyChatCustomField from '../manychat/manyChatset.js';

export async function handleEvent(req, res) {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('Dados recebidos:', req.body);
    const userName = req.body.Name;
    const userID = req.body.ManyChatID;
    const userEmail = req.body.Email;
    const userHour = req.body.Horario;
    const userModel = req.body.Modelo;
    
    // Define a localização e os dados da conferência dependendo do modelo do evento
    let location;
    let conferenceData = null;

    if (userModel === 'Presencial') {
      location = "Presencialmente no endereço: XXXXXXXXXXXXXXXXXXX";
    } else if (userModel === 'On-line') {
      location = "Reunião online no Google Meet";
      
      // Adiciona o conferenceData.createRequest para gerar o link de reunião no Google Meet
      conferenceData = {
        createRequest: {
          requestId: `meet_${userID}_${Date.now()}`, // ID único para a reunião
          conferenceSolutionKey: {
            type: "hangoutsMeet" // Define o tipo de conferência para Google Meet
          }
        }
      };
    }

    // Função para adicionar 1 hora ao horário do evento
    function addOneHourToISO(isoString) {
      const dateTime = moment.utc(isoString);
      dateTime.add(1, 'hours');
      return dateTime.toISOString();
    }

    // Garante que `userHour` seja uma data válida e que a hora final seja depois da hora de início
    if (!userHour) {
      throw new Error("Horário do evento não fornecido.");
    }

    const startDateTime = moment(userHour).toISOString();
    const endDateTime = addOneHourToISO(userHour);  // Adiciona 1 hora ao horário de início

    // Certifique-se de que o horário final é posterior ao horário inicial
    if (moment(startDateTime).isSameOrAfter(endDateTime)) {
      throw new Error("O horário de término do evento deve ser posterior ao horário de início.");
    }

    // Configuração do evento
    const event = {
      summary: userName,
      description: 'Reunião agendada pela Alice IA.',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: 'paulo.motta@v4company.com' }, // Altere conforme necessário
        { email: userEmail }
      ],
      reminders: {
        useDefault: true,
      },
      location: location,
      conferenceData: conferenceData
    };

    // Inserir o evento no Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    console.log('Evento criado:', response.data);

    // Armazena o eventId no ManyChat
    const eventId = response.data.id;
    await updateManyChatCustomField(userID, eventId, null, null, null, null);

    res.status(200).send({
      message: 'Evento criado com sucesso',
      event: response.data,
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).send({
      message: `Erro ao criar evento: ${error.message}`,
    });
  }
}
