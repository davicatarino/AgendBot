// services/openAi/handlerFunctionCall.js
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
                  `Title: ${video.title}\nDescription: ${video.description}\nURL: ${video.url}\n`,
              )
              .join('\n');

          const assistantResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
          });

          output = assistantResponse.data.choices[0].message.content;
        } catch (error) {
          output = { error: error.message };
        }
        break;

      case 'handleEvent':
        try {
          const eventResult = await handleEventFunction(args);
          output = eventResult;
        } catch (error) {
          output = { error: error.message };
        }
        break;

      case 'handleAvailable':
        try {
          const availableSlots = await handleAvailableFunction(args);
          output = availableSlots;
        } catch (error) {
          output = { error: error.message };
        }
        break;

      case 'handleDelete':
        try {
          const deleteResult = await handleDeleteFunction(args);
          output = deleteResult;
        } catch (error) {
          output = { error: error.message };
        }
        break;

      default:
        output = { error: `Função ${functionName} não reconhecida.` };
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
