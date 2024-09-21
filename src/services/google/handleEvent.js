import { oauth2Client } from '../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';
import updateManyChatCustomField from '../manychat/manyChatset.js'; // Importa a função para atualizar o ManyChat

// Função para criar um evento no Google Calendar e armazenar o eventId no ManyChat
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

    const newHour = addOneHourToISO(userHour);

    // Configuração do evento
    const event = {
      summary: userName,
      description: 'Reunião agendada pela Alice IA.',
      start: {
        dateTime: userHour,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: newHour,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: 'paulo.motta@v4company.com' }, // Altere conforme necessário
        { email: userEmail }
      ],
      reminders: {
        useDefault: true,
      },
      location: location, // Define a localização com base no modelo do evento
      conferenceData: conferenceData // Adiciona os dados de conferência se o evento for online
    };

    // Inserir o evento no Google Calendar com a versão do conferenceData
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1, // Necessário para que o conferenceData seja aplicado
    });

    console.log('Evento criado:', response.data);

    // Armazena o eventId no ManyChat
    const eventId = response.data.id;
    await updateManyChatCustomField(userID, eventId, null, null, null, null); // Armazena apenas o eventId

    // Enviar resposta ao cliente
    res.status(200).send({
      message: 'Evento criado com sucesso',
      event: response.data,
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).send({
      message: 'Erro ao criar evento',
      error: error.message,
    });
  }
}
