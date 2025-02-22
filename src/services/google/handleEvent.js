import { oauth2Client } from '../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';
import updateManyChatCustomField from '../manychat/manyChatset.js';

import Event from '../../models/eventModels.js';

export async function handleEvent(args) {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('Dados recebidos:', args);

    // Extração de dados do usuário
    const {
      Name: userName,
      ManyChatID: userID,
      Email: userEmail,
      Horario: userHour,
      Telefone: userTel,
      CPF: userCpf,
      Procedimento: userProced,
      ComoNosConheceu: userComoNosConheceu,
      Nascimento: userNascimento,
      Modelo: userModel
    } = args;

    // Definindo localização e dados de conferência com base no modelo do evento
    let location;
    let conferenceData = null;

    if (userModel === 'Presencial') {
      location = "Presencialmente no endereço: Av. João Cabral de Melo Netto, 850 - Torre Norte 10˚ andar - Barra da Tijuca, próximo ao condomínio Peninsula";
    } else if (userModel === 'On-line') {
      location = "Reunião online no Google Meet";
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

    // Validação do horário do evento
    if (!userHour) {
      throw new Error("Horário do evento não fornecido.");
    }

    const startDateTime = moment(userHour).toISOString();
    const endDateTime = addOneHourToISO(userHour);  // Adiciona 1 hora ao horário de início

    if (moment(startDateTime).isSameOrAfter(endDateTime)) {
      throw new Error("O horário de término do evento deve ser posterior ao horário de início.");
    }

    // Configuração do evento
    const event = {
      summary: userName,
      description: `
        Reunião agendada pela Alice IA.
        Nome: ${userName}
        CPF: ${userCpf}
        Telefone: ${userTel}
        Nascimento: ${userNascimento}
        Procedimento: ${userProced}
        Como nos conheceu: ${userComoNosConheceu}
      `,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: 'fernandadebessa@gmail.com' }, // Altere conforme necessário
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
      calendarId: 'd4aa7e90b3d2b85cf7e89b51c0238b96e26a1fb0126db396d3d899dd36a0b6df@group.calendar.google.com',
      resource: event,
      conferenceDataVersion: 1,
    });

    console.log('Evento criado:', response.data);

    // Armazenando o eventId no ManyChat
    const eventId = response.data.id;
    await updateManyChatCustomField(userID, eventId, null, null, null, null);
    console.log({
      userName,
      userID,
      userEmail,
      userTel,
      userCpf,
      userProced,
      userComoNosConheceu,
      userNascimento
    });
    
    const newEvent = new Event({
      userName,
      userID,
      userEmail,
      userTel,
      userCpf,
      userProced,
      userComoNosConheceu,
      userNascimento
    });

    await newEvent.save();
    console.log('Dados salvos no MongoDB');

    return `Evento criado com sucesso. ID do evento: ${eventId}`;
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return `Erro ao criar evento: ${error.message}`;
  }
}
