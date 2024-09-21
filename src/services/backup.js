import OpenAI from 'openai';
import config from '../config/index.js';
import updateManyChatCustomField from './manychat/manyChatset.js';
import getVideoLinks from './google/getVideos.js';
/*  // Configura as variáveis de ambiente */

config();
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
global.getVideoLinks = getVideoLinks;

/*assistant function declaration  */

const assistantFunctions = [
  {
    type: 'function',
    function: {
      name: 'get_video_links',
      description: 'Busca links de vídeos do YouTube',
      parameters: {
        type: 'object',
        properties: {
          business_niche: {
            type: 'string',
            description:
              'O nicho de negócios, e.g. marketing digital, fitness, culinária',
          },
          limit: {
            type: 'integer',
            description: 'O número de links de vídeo a serem recuperados',
            default: 1,
          },
        },
        required: ['business_niche'],
      },
    },
  },
];

/* call assistant function  */

async function handleFunctionCall(toolCalls) {
  const toolOutputs = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    let output;

    console.log(`Chamando função: ${functionName} com argumentos:`, args);

    if (functionName === 'get_video_links') {
      const videos = await getVideoLinks(args.limit || 50);
      const prompt =
        `Filtre os vídeos abaixo e escolha os que são relevantes para o nicho de negócios: "${args.business_niche}".\n\n` +
        videos
          .map(
            (video) =>
              `Title: ${video.title}\nDescription: ${video.description}\nURL: ${video.url}\n`,
          )
          .join('\n');

      const assistantResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      output = assistantResponse.choices[0].message.content;
    }

    console.log(`Output da função ${functionName}:`, output);

    toolOutputs.push({
      tool_call_id: toolCall.id,
      output,
    });
  }

  return toolOutputs;
}

/* run status verification */
export async function VerificationRunStatus(userThread, runId, runStatus) {
  while (runStatus !== 'completed') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const runStatusObject = await openai.beta.threads.runs.retrieve(
      userThread,
      runId,
    );
    runStatus = runStatusObject.status;

    console.log(`Status do run: ${runStatus}`);

    if (runStatus === 'requires_action') {
      console.log('Run requer ação');
      const toolCalls =
        runStatusObject.required_action.submit_tool_outputs.tool_calls;
      console.log('Chamadas de ferramenta requeridas:', toolCalls);
      const toolOutputs = await handleFunctionCall(toolCalls);
      console.log('Outputs das ferramentas:', toolOutputs);
      await openai.beta.threads.runs.submitToolOutputs(userThread, runId, {
        tool_outputs: toolOutputs,
      });
      console.log('Tool outputs submetidos');
    }

    if (['failed', 'cancelled', 'expired'].includes(runStatus)) {
      console.log(
        `Run status is '${runStatus}'. Unable to complete the request.`,
      );
      break;
    }
  }
  return runStatus;
}

export async function handleChat(req, res) {
  console.log('Iniciou handleChat:');
  console.log('Dados recebidos:', req.body);
  const {
    Nome: userName,
    ManychatID: userID,
    ThreadID: userThread,
    Pergunta: userMessage,
  } = req.body;

  try {
    console.log('Criando mensagem no thread');
    await openai.beta.threads.messages.create(userThread, {
      role: 'user',
      content: userMessage,
    });
    console.log('Mensagem criada no thread');
    console.log(userMessage);

    console.log('Configurando busca na vector store');
    const run = await openai.beta.threads.runs.create(userThread, {
      assistant_id: 'asst_Nh2qtDz0liVnK6CWaLQOt1Jx',
      additional_instructions: `Os clientes da v4 company gostam de mensagens práticas e breves, faça comentários sobre as informações que o usuário passar antes de fazer perguntas. Você tem a função de pesquisar vídeos de um playlist de casos de sucesso da v4 company.Chame o usuário pelo nome ${userName}.`,
      additional_messages: [
        {
          role: 'user',
          content: 'Olá, eu prefiro respostas e frases curtas.',
        },
        {
          role: 'assistant',
          content: 'Claro, te ajudarei hoje com respostas fáceis e práticas.',
        },
        {
          role: 'user',
          content: 'gosto de respostas calorosas',
        },
        {
          role: 'assistant',
          content: 'Claro, vou ser sempre positiva e animada.',
        },
      ],
      tools: assistantFunctions,
    });

    console.log('Run criado:', run);

    const runId = run.id;
    let runStatus = run.status;

    console.log(`Run ID: ${runId}, Status inicial do run: ${runStatus}`);

    const finalRunStatus = await VerificationRunStatus(
      userThread,
      runId,
      runStatus,
    );
    console.log('Status final do run:', finalRunStatus);

    /*   const assistantMessage = run.final_message.content;
        const finalResponse = await openai.beta.threads.messages.list(userThread, {
      limit: 1,
      direction: 'desc',
    });

    const assistantMessage = finalResponse.data[0].content[0].text.value;
    console.log('Mensagem final do assistente:', assistantMessage); */
    const messages = await openai.beta.threads.messages.list(userThread);
    console.log('Mensagens no thread:', messages);
    
    // Supondo que `messages.data` seja uma lista de objetos, e cada objeto tenha uma propriedade `content`
    const lastMessage = messages.data[0].content.text;
    console.log('_____--------- ', lastMessage)
    // A estrutura de `lastMessage.content` pode variar, então vamos garantir que estamos acessando corretamente:
  
    
    let finalMessage = lastMessage.replace(/【.*?†.*?】/g, '');
    
    console.log('Texto da última mensagem no thread:', lastMessage);
    console.log('Mensagem final processada:', finalMessage);
    
    const parts = finalMessage.split(/(?<=[.?!])\s+/);
    
    // Filtrar partes nulas ou vazias antes de enviar para o ManyChat
    const filteredParts = parts.filter(part => part && part.trim() !== '');
    
    const part1 = filteredParts.length > 0 ? filteredParts[0] : null;
    const part2 = filteredParts.length > 1 ? filteredParts[1] : null;
    const part3 = filteredParts.length > 2 ? filteredParts[2] : null;
    const part4 = filteredParts.length > 3 ? filteredParts[3] : null;
    
    res.status(200).send('Resposta do Assistente: ' + finalMessage);
    console.log('Resposta enviada para ManyChat');
    updateManyChatCustomField(userID, part1, part2, part3, part4);
    
  } catch (error) {
    console.error('Erro na API do GPT:', error);
    res.status(500).send('Erro ao processar a mensagem');
  }
}


//handle available

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
      calendarId: 'paulo.motta@v4company.com',
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
        if (!intervalExists && startTime.isBefore(endTime)) {
          freeTimes.push({
            start: startTime.format('DD/MM HH:mm'), // Formata para dd/MM HH:mm
            end: endTime.format('DD/MM HH:mm'), // Formata para dd/MM HH:mm
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


//backup  funcional de manychatset

import axios from 'axios';
import config from '../../config/index.js';
/* import { getUserID, getAssistantMessage } from './services/openaiService'; */
config(); // Configura as variáveis de ambiente

export default function updateManyChatCustomField(userID, part1, part2, part3, part4 ) {
  const updateUrl = 'https://api.manychat.com/fb/subscriber/setCustomField';
  const sendFlowUrl = 'https://api.manychat.com/fb/sending/sendFlow';
  const accessToken = process.env.MC_KEY; // Substitua pelo seu token de acesso
  const subscriberId = userID; // Substitua pelo ID do assinante
  const customFieldId1 = '11709706'; // Substitua pelo ID do campo personalizado
  const customFieldId2 = '11709687'; // Substitua pelo ID do campo personalizado
  const customFieldId3 = '11709686'; // Substitua pelo ID do campo personalizado
  const customFieldId4 = '11709710'; // Substitua pelo ID do campo personalizado
  const newValue1 = part1; // Substitua pelo novo valor para o campo
  const newValue2 = part2; // Substitua pelo novo valor para o campo
  const newValue3 = part3; // Substitua pelo novo valor para o campo
  const newValue4 = part4; // Substitua pelo novo valor para o campo

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const updateBody1 = {
    subscriber_id: subscriberId,
    field_id: customFieldId1,
    field_value: part1,
  };

  axios
    .post(updateUrl, updateBody1, config)
    .then((response) => {
      console.log('Success updating custom field:', response.data);
      // Agora dispara o flow depois de atualizar o campo

      const updateBody2 = {
        subscriber_id: subscriberId,
        field_id: customFieldId2,
        field_value: part2,
      };

      if (part2 !== null) {
        axios.post(updateUrl, updateBody2, config).then((response) => {
          console.log('Success updating custom field:', response.data);
        });
        const updateBody3 = {
          subscriber_id: subscriberId,
          field_id: customFieldId3,
          field_value: part3,
        };

        if (part3 !== null) {
          axios.post(updateUrl, updateBody3, config).then((response) => {
            console.log('Success updating custom field:', response.data);
          });
          const updateBody4 = {
            subscriber_id: subscriberId,
            field_id: customFieldId4,
            field_value: part4,
          };

          if (part4 !== null) {
            axios.post(updateUrl, updateBody4, config).then((response) => {
              console.log('Success updating custom field:', response.data);
            });
          }
        }
      }

      // Agora dispara o flow depois de atualizar o campo
      const sendFlowBody = {
        subscriber_id: subscriberId,
        flow_ns: 'content20240424030043_216729',
      };

      axios
        .post(sendFlowUrl, sendFlowBody, config)
        .then((response) =>
          console.log('Success triggering flow:', response.data),
        )
        .catch((error) => console.error('Error triggering flow:', error));
    })
    .catch((error) => console.error('Error updating custom field:', error));
  console.log('Update process started for:', part1, part2, part3, part4);
}

//backup nao funcional de manychatset

import axios from 'axios';
import config from '../../config/index.js';
/* import { getUserID, getAssistantMessage } from './services/openaiService'; */
config(); // Configura as variáveis de ambiente

export default function updateManyChatCustomField(userID, eventID, part1, part2, part3, part4,) {
  const updateUrl = 'https://api.manychat.com/fb/subscriber/setCustomField';
  const sendFlowUrl = 'https://api.manychat.com/fb/sending/sendFlow';
  const accessToken = process.env.MC_KEY; // Substitua pelo seu token de acesso
  const customFieldEventID = '11755389'; // Substitua pelo ID do campo personalizado
  const customFieldId1 = '11709706'; // Substitua pelo ID do campo personalizado
  const customFieldId2 = '11709687'; // Substitua pelo ID do campo personalizado
  const customFieldId3 = '11709686'; // Substitua pelo ID do campo personalizado
  const customFieldId4 = '11709710'; // Substitua pelo ID do campo personalizado

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  
  
  axios.then((response) => {

      const updateBody0 = {
        subscriber_id: userID,
        field_id: customFieldEventID,
        field_value: eventID,
      };
    
      if (eventID !== null) {
        axios.post(updateUrl, updateBody0, config).then((response) => {
          console.log('Success updating custom field:', response.data);
        });
      }
    
      const updateBody1 = {
        subscriber_id: userID,
        field_id: customFieldId1,
        field_value: part1,
      };

      if (part1 !== null) {
        axios.post(updateUrl, updateBody1, config).then((response) => {
          console.log('Success updating custom field:', response.data);
        });
      }

      const updateBody2 = {
        subscriber_id: userID,
        field_id: customFieldId2,
        field_value: part2,
      };

      if (part2 !== null) {
        axios.post(updateUrl, updateBody2, config).then((response) => {
          console.log('Success updating custom field:', response.data);
        });
        
        const updateBody3 = {
          subscriber_id: userID,
          field_id: customFieldId3,
          field_value: part3,
        };

        if (part3 !== null) {
          axios.post(updateUrl, updateBody3, config).then((response) => {
            console.log('Success updating custom field:', response.data);
          });
          const updateBody4 = {
            subscriber_id: userID,
            field_id: customFieldId4,
            field_value: part4,
          };

          if (part4 !== null) {
            axios.post(updateUrl, updateBody4, config).then((response) => {
              console.log('Success updating custom field:', response.data);
            });
          }
        }
      }

      // Agora dispara o flow depois de atualizar o campo
      const sendFlowBody = {
        subscriber_id: userID,
        flow_ns: 'content20240424030043_216729',
      };

      axios
        .post(sendFlowUrl, sendFlowBody, config)
        .then((response) =>
          console.log('Success triggering flow:', response.data),
        )
        .catch((error) => console.error('Error triggering flow:', error));
    })
    .catch((error) => console.error('Error updating custom field:', error));
  console.log('Update process started for:', part1, part2, part3, part4, userID);
}
