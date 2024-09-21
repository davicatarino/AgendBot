// assistantFunctions.js
const assistantFunctions = [
  {
    type: 'function',
    function: {
      name: 'handleEvent',
      description: 'Cria um evento no Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          Name: { type: 'string', description: 'Nome do evento' },
          ManyChatID: { type: 'string', description: 'ID do usuário no ManyChat' },
          Email: { type: 'string', format: 'email', description: 'Email do usuário' },
          Horario: { type: 'string', format: 'date-time', description: 'Data e hora do evento' },
          Modelo: { type: 'string', enum: ['Presencial', 'On-line'], description: 'Modelo do evento' },
        },
        required: ['Name', 'ManyChatID', 'Email', 'Horario', 'Modelo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'handleAvailable',
      description: 'Recupera horários disponíveis para agendamento nos próximos 7 dias.',
      parameters: {
        type: 'object',
        properties: {
          // Adicione parâmetros se necessário
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'handleDelete',
      description: 'Cancela um evento no Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          EventID: { type: 'string', description: 'ID do evento a ser cancelado' },
        },
        required: ['EventID'],
      },
    },
  },
];

export default assistantFunctions;
