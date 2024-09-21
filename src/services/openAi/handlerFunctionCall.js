// handlerFunctionCall.js
import openai from './openAiClient.js';
import getVideoLinks from '../google/getVideos.js';
import { handleEvent, handleAvailable, handleDelete } from '../google/eventFunctions.js'; // Importe as novas funções

async function handleFunctionCall(toolCalls) {
  const toolOutputs = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    let output;

    console.log(`Chamando função: ${functionName} com argumentos:`, args);

    switch (functionName) {
      case 'get_video_links':
        const videos = await getVideoLinks(args.limit || 50);
        const prompt =
          `Filtre os vídeos abaixo e escolha os que são relevantes para o nicho de negócios: "${args.business_niche}".\n\n` +
          videos
            .map(
              (video) =>
                `Title: ${video.title}\nDescription: ${video.description}\nURL: ${video.url}\n`,
            )
            .join('\n');

        const assistantResponse = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });

        output = assistantResponse.data.choices[0].message.content;
        break;

      case 'handleEvent':
        // Assumindo que handleEvent retorna um objeto com detalhes do evento criado
        const eventResult = await handleEvent(args);
        output = {
          message: 'Evento criado com sucesso',
          event: eventResult,
        };
        break;

      case 'handleAvailable':
        const availableSlots = await handleAvailable(args);
        output = availableSlots;
        break;

      case 'handleDelete':
        const deleteResult = await handleDelete(args);
        output = deleteResult;
        break;

      default:
        output = `Função ${functionName} não reconhecida.`;
    }

    console.log(`Output da função ${functionName}:`, output);

    toolOutputs.push({
      tool_call_id: toolCall.id,
      output,
    });
  }

  return toolOutputs;
}

export default handleFunctionCall;
