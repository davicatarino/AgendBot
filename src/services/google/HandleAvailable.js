import { oauth2Client } from './../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';

// Função para calcular horários livres nos próximos 7 dias
export async function handleAvailable(req, res) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const today = moment().tz('America/Sao_Paulo').startOf('day');

  let timeMin = today.format(); // Início do primeiro dia às 00:00 no fuso horário de São Paulo
  let timeMax = today.clone().add(7, 'days').endOf('day').format(); // Final do sétimo dia às 23:59 no fuso horário de São Paulo

  calendar.events.list(
    {
      calendarId: 'davi.catarino@hotmail.com',
      timeMin: timeMin,
      timeMax: timeMax,
      timeZone: 'America/Sao_Paulo',
      maxResults: 250, // Aumentado para cobrir múltiplos dias
      singleEvents: true,
      orderBy: 'startTime',
    },
    (error, result) => {
      if (error) {
        return res.status(500).send(JSON.stringify({ error: error }));
      }

      const events = result.data.items;
      let freeTimes = [];

      // Gerar horários livres para cada dia
      for (let day = 0; day < 7; day++) {
        let dayStart = moment(today)
          .add(day, 'days')
          .set({ hour: 8, minute: 0, second: 0 })
          .tz('America/Sao_Paulo'); // 8h no fuso horário de São Paulo
        let dayEnd = moment(today)
          .add(day, 'days')
          .set({ hour: 18, minute: 0, second: 0 })
          .tz('America/Sao_Paulo'); // 18h no fuso horário de São Paulo
        let lastEndTime = dayStart;

        const dayEvents = events
          .filter((event) => {
            const eventStart = moment(
              event.start.dateTime || event.start.date,
            ).tz('America/Sao_Paulo');
            const eventEnd = moment(event.end.dateTime || event.end.date).tz(
              'America/Sao_Paulo',
            );
            return eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart);
          })
          .sort(
            (a, b) =>
              moment(a.start.dateTime).tz('America/Sao_Paulo') -
              moment(b.start.dateTime).tz('America/Sao_Paulo'),
          ); // Ordena eventos por hora de início

        dayEvents.forEach((event, index) => {
          const eventStart = moment(
            event.start.dateTime || event.start.date,
          ).tz('America/Sao_Paulo');
          const eventEnd = moment(event.end.dateTime || event.end.date).tz(
            'America/Sao_Paulo',
          );

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
        const intervalExists = freeTimes.some(
          (freeTime) =>
            freeTime.start === startTime.format() &&
            freeTime.end === endTime.format(),
        );
        
        // Adiciona checagem para ver se algum evento divide o tempo livre
        let conflictingEvents = events.filter((event) => {
            const eventStart = moment(event.start.dateTime || event.start.date).tz('America/Sao_Paulo');
            const eventEnd = moment(event.end.dateTime || event.end.date).tz('America/Sao_Paulo');
            return eventStart.isBefore(endTime) && eventEnd.isAfter(startTime);
        });
    
        // Se houver conflitos, dividimos o tempo livre em partes
        if (conflictingEvents.length > 0) {
            conflictingEvents.forEach((event, index) => {
                const eventStart = moment(event.start.dateTime || event.start.date).tz('America/Sao_Paulo');
                const eventEnd = moment(event.end.dateTime || event.end.date).tz('America/Sao_Paulo');
    
                // Adicionar tempo livre antes do evento (se houver)
                if (startTime.isBefore(eventStart)) {
                    freeTimes.push({
                        start: startTime.format('DD/MM HH:mm'),
                        end: eventStart.format('DD/MM HH:mm'),
                    });
                }
    
                // Atualizar o início do próximo intervalo para depois do evento
                startTime = eventEnd;
            });
        }
    
        // Adicionar o restante do tempo livre após o último evento (se houver)
        if (startTime.isBefore(endTime) && !intervalExists) {
            freeTimes.push({
                start: startTime.format('DD/MM HH:mm'),
                end: endTime.format('DD/MM HH:mm'),
            });
        }
    }
    
      function formatFreeTimes(freeTimes) {
        return freeTimes.map((ft) => `${ft.start} - ${ft.end}`).join(', ');
      }
      const formattedFreeTimes = formatFreeTimes(freeTimes);
      console.log(formattedFreeTimes)
      res.send({ formattedFreeTimes });
    },
  );
}
