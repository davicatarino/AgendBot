import { oauth2Client } from './../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';

/**
 * Calcula horários livres nos próximos 7 dias.
 * @param {Object} args - Argumentos necessários (se houver).
 * @returns {String} Horários disponíveis formatados ou erro.
 */
export async function handleAvailable(args) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const today = moment().tz('America/Sao_Paulo').startOf('hour');

  let timeMin = today.format();
  let timeMax = today.clone().add(7, 'days').endOf('day').format();

  try {
    const result = await calendar.events.list({
      calendarId: 'davi.catarino@hotmail.com',
      timeMin: timeMin,
      timeMax: timeMax,
      timeZone: 'America/Sao_Paulo',
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = result.data.items;
    let freeTimes = [];

    // Processa os eventos do Google Calendar
    for (let day = 0; day < 7; day++) {
      let dayStart = moment(today)
        .add(day, 'days')
        .set({ hour: 8, minute: 0, second: 0 })
        .tz('America/Sao_Paulo');
      let dayEnd = moment(today)
        .add(day, 'days')
        .set({ hour: 18, minute: 0, second: 0 })
        .tz('America/Sao_Paulo');
      let lastEndTime = dayStart;

      const dayEvents = events
        .filter((event) => {
          const eventStart = moment(event.start.dateTime || event.start.date).tz('America/Sao_Paulo');
          const eventEnd = moment(event.end.dateTime || event.end.date).tz('America/Sao_Paulo');
          return eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart);
        })
        .sort((a, b) =>
          moment(a.start.dateTime).tz('America/Sao_Paulo') - moment(b.start.dateTime).tz('America/Sao_Paulo')
        );

      dayEvents.forEach((event, index) => {
        const eventStart = moment(event.start.dateTime || event.start.date).tz('America/Sao_Paulo');
        const eventEnd = moment(event.end.dateTime || event.end.date).tz('America/Sao_Paulo');

        if (index === 0 && eventStart.isAfter(dayStart)) {
          addFreeTime(dayStart, eventStart);
        }

        if (lastEndTime.isBefore(eventStart)) {
          addFreeTime(lastEndTime, eventStart);
        }

        lastEndTime = eventEnd;
      });

      if (lastEndTime.isBefore(dayEnd)) {
        addFreeTime(lastEndTime, dayEnd);
      }
    }

    function addFreeTime(startTime, endTime) {
      if (startTime.isBefore(endTime)) {
        freeTimes.push({
          start: startTime.format('DD/MM HH:mm'),
          end: endTime.format('DD/MM HH:mm'),
        });
      }
    }

    // Função para formatar os horários livres
    function formatFreeTimes(freeTimes) {
      return freeTimes.map((ft) => `${ft.start} - ${ft.end}`).join(', ');
    }

    const formattedFreeTimes = formatFreeTimes(freeTimes);

    console.log(formattedFreeTimes);

    // Retorne diretamente a string com os horários formatados
    return formattedFreeTimes;  // Corrigido aqui!
  } catch (error) {
    console.error('Erro ao recuperar horários disponíveis:', error);
    throw new Error('Erro ao recuperar horários disponíveis: ' + error.message);
  }
}
