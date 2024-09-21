import openai from './openAiClient.js';
import fs from 'fs'; // File System para salvar o arquivo
import path from 'path'; // Para trabalhar com caminhos
import { fileURLToPath } from 'url'; // Corrige __dirname para ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function transcribeAudio(audioFilePath) {
  const audiosDir = path.join(__dirname, '../../audios');

  // Verifica se o diretório existe, caso contrário, cria
  if (!fs.existsSync(audiosDir)) {
    fs.mkdirSync(audiosDir, { recursive: true });
  }

  try {
    // Verifica se o arquivo de áudio existe
    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Arquivo de áudio não encontrado: ' + audioFilePath);
    }

    // Transcrição do áudio com o modelo Whisper
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });

    return response.text; // Retorna a transcrição
  } catch (error) {
    console.error('Erro ao transcrever o áudio:', error.message || error.response.data);
    throw error;
  }
}
