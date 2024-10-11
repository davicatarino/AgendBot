import { oauth2Client } from './../auth/autheticationGoogle.js';
import { google } from 'googleapis';
import moment from 'moment-timezone';

/**
 * Calcula horários livres nos próximos 7 dias usando freebusy.query.
 * @param {Object} args - Argumentos necessários (se houver).
 * @returns {String} Horários disponíveis formatados ou erro.
 */
export async function handleAvailable(args) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const timezone = 'America/Sao_Paulo';
  const today = moment().tz(timezone).startOf('day');

  const timeMin = today.toISOString();
  const timeMax = today.clone().add(15, 'days').endOf('day').toISOString();

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: timezone,
        items: [{id:'d4aa7e90b3d2b85cf7e89b51c0238b96e26a1fb0126db396d3d899dd36a0b6df@group.calendar.google.com' }],
      },
    });

    const busyTimes = response.data.calendars['d4aa7e90b3d2b85cf7e89b51c0238b96e26a1fb0126db396d3d899dd36a0b6df@group.calendar.google.com'].busy;
    let freeTimes = [];
    let debugInfo = []; // Para armazenar informações de depuração

    // Ordenar os horários ocupados globalmente
    const sortedBusyTimes = busyTimes
      .map(interval => ({
        start: moment(interval.start).tz(timezone),
        end: moment(interval.end).tz(timezone),
      }))
      .sort((a, b) => a.start - b.start);

    debugInfo.push('Intervalos Ocupados Ordenados:');
    sortedBusyTimes.forEach((interval, index) => {
      debugInfo.push(`  Evento ${index + 1}: ${interval.start.format('DD/MM/YYYY HH:mm')} - ${interval.end.format('DD/MM/YYYY HH:mm')}`);
    });

    for (let day = 0; day < 7; day++) {
      let currentDay = today.clone().add(day, 'days');
      let dayStart = currentDay.clone().set({ hour: 8, minute: 0, second: 0 });
      let dayEnd = currentDay.clone().set({ hour: 18, minute: 0, second: 0 });

      // Filtra os períodos ocupados que intersectam com o dia atual
      const dayBusy = sortedBusyTimes.filter(interval =>
        interval.start.isBefore(dayEnd) && interval.end.isAfter(dayStart)
      );

      debugInfo.push(`\nDia: ${currentDay.format('DD/MM/YYYY')}`);
      if (dayBusy.length === 0) {
        debugInfo.push('  Nenhum evento ocupado neste dia.');
        freeTimes.push({
          start: dayStart.format('dddd, DD/MM HH:mm'), // Inclui o dia da semana
          end: dayEnd.format('dddd, DD/MM HH:mm'),     // Inclui o dia da semana
        });
        continue;
      } else {
        dayBusy.forEach((interval, index) => {
          debugInfo.push(`  Evento ${index + 1}: ${interval.start.format('HH:mm')} - ${interval.end.format('HH:mm')}`);
        });
      }

      let lastEndTime = dayStart;

      dayBusy.forEach(interval => {
        // Verifica se há um intervalo livre antes do evento atual
        if (lastEndTime.isBefore(interval.start)) {
          addFreeTime(lastEndTime, interval.start);
          debugInfo.push(`  Livre: ${lastEndTime.format('HH:mm')} - ${interval.start.format('HH:mm')}`);
        }
        // Atualiza lastEndTime para o final do evento atual
        if (lastEndTime.isBefore(interval.end)) {
          lastEndTime = interval.end;
        }
      });

      // Adiciona qualquer horário livre após o último evento até o final do dia
      if (lastEndTime.isBefore(dayEnd)) {
        addFreeTime(lastEndTime, dayEnd);
        debugInfo.push(`  Livre: ${lastEndTime.format('HH:mm')} - ${dayEnd.format('HH:mm')}`);
      }
    }

    // Função para adicionar intervalos de tempo livre
    function addFreeTime(startTime, endTime) {
      if (startTime.isBefore(endTime)) {
        // Subtrai uma hora do endTime em todos os casos
        const adjustedEndTime = moment(endTime).subtract(1, 'hours');
    
        // Verifica se o intervalo livre inclui um horário ocupado
        const overlappingBusy = sortedBusyTimes.some(interval =>
          startTime.isBefore(interval.end) && adjustedEndTime.isAfter(interval.start)
        );
    
        if (startTime.isBefore(adjustedEndTime)) {
          freeTimes.push({
            start: startTime.format('dddd, DD/MM HH:mm'), // Inclui o dia da semana
            end: adjustedEndTime.format('dddd, DD/MM HH:mm'), // Inclui o dia da semana
          });
        }
      }
    }
    

    // Função para formatar os horários livres
    function formatFreeTimes(freeTimes) {
      return freeTimes.map(ft => `${ft.start} - ${ft.end}`).join(', ');
    }

    // Função para formatar as informações de depuração
    function formatDebugInfo(debugInfo) {
      return debugInfo.join('\n');
    }

    const formattedFreeTimes = formatFreeTimes(freeTimes);
    const formattedDebugInfo = formatDebugInfo(debugInfo);

    // Retorna os horários livres juntamente com as informações de depuração
    const finalOutput = `Horários Livres:\n${formattedFreeTimes}\n\nInformações de Depuração:\n${formattedDebugInfo}`;

    return finalOutput; // Retornar os horários livres e informações de depuração
  } catch (error) {
    console.error('Erro ao recuperar horários disponíveis:', error);
    throw new Error('Erro ao recuperar horários disponíveis: ' + error.message);
  }
}
