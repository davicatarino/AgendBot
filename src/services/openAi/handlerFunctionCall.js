import openai from './openAiClient.js';
import getVideoLinks from '../google/getVideos.js';
import { handleEventFunction, handleAvailableFunction, handleDeleteFunction } from '../google/eventFunctions.js';

async function handleFunctionCall(toolCalls) {
  const toolOutputs = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    let output;

    console.log(`Chamando função: ${functionName} com argumentos:`, args);

    switch (functionName) {
      case 'get_video_links':
        try {
          const videos = await getVideoLinks(args.limit || 50);
          const prompt =
            `Filtre os vídeos abaixo e escolha os que são relevantes para o nicho de negócios: "${args.business_niche}".\n\n` +
            videos
              .map(
                (video) =>
                  `Title: ${video.title}\nDescription: ${video.description}\nURL: ${video.url}\n`
              )
              .join('\n');

          const assistantResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
          });

          output = assistantResponse.data.choices[0].message.content;
        } catch (error) {
          output = `Erro ao buscar vídeos: ${error.message}`;
        }
        break;

      case 'handleEvent':
        try {
          const eventResult = await handleEventFunction(args);
          output = eventResult;  // Certifique-se de que seja uma string.
        } catch (error) {
          output = `Erro ao criar evento: ${error.message}`;
        }
        break;

      case 'handleAvailable':
        try {
          // Certifique-se de que `handleAvailableFunction` retorne uma string diretamente
          const availableSlots = await handleAvailableFunction(args);
          output = availableSlots;  // Aqui garantimos que seja uma string.
        } catch (error) {
          output = `Erro ao buscar horários disponíveis: ${error.message}`;
        }
        break;

      case 'handleDelete':
        try {
          const deleteResult = await handleDeleteFunction(args);
          output = deleteResult;  // Certifique-se de que seja uma string.
        } catch (error) {
          output = `Erro ao deletar evento: ${error.message}`;
        }
        break;

      default:
        output = `Função ${functionName} não reconhecida.`;
    }

    console.log(`Output da função ${functionName}:`, output);

    toolOutputs.push({
      tool_call_id: toolCall.id,
      output: output.toString(),  // Força o retorno a ser uma string
    });
    
  }

  return toolOutputs;
}

export default handleFunctionCall;
