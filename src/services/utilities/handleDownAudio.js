import axios from 'axios';
import fs from 'fs';
import path from 'path'; // Para garantir o caminho correto

// Função para baixar o arquivo de áudio .ogg
export default async function downloadAudio(url, outputPath) {
  try {
    // Garante que o diretório exista
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Erro ao fazer o download do áudio:', error);
    throw error;
  }
}
