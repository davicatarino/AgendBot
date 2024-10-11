import axios from 'axios';
import moment from 'moment-timezone';
import config from '../../config/index.js';
config(); // Configura as variáveis de ambiente

export default async function updateManyChatCustomField(userID, eventID, part1, part2, part3, part4) {
  const updateUrl = 'https://api.manychat.com/fb/subscriber/setCustomField';
  const sendFlowUrl = 'https://api.manychat.com/fb/sending/sendFlow';
  const accessToken = process.env.MC_KEY; // Substitua pelo seu token de acesso
  const customFieldEventID = '11778653'; // ID do campo para eventID
  const customFieldIds = {
    part1: '11778648',
    part2: '11778649',
    part3: '11778650',
    part4: '11778651',
  };

  const customFieldDate = '11785555'; // ID do campo personalizado para armazenar a data

  const configAxios = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Função para verificar se o valor é válido (não é nulo, indefinido ou vazio)
  const isValidValue = (value) => {
    return value !== null && value !== undefined && value !== '';
  };

  // Função para atualizar campos personalizados no ManyChat
  const updateCustomField = async (fieldId, fieldValue) => {
    try {
      if (isValidValue(fieldValue)) {
        const updateBody = {
          subscriber_id: userID,
          field_id: fieldId,
          field_value: fieldValue,
        };
        const response = await axios.post(updateUrl, updateBody, configAxios);
        console.log(`Success updating custom field ${fieldId}:`, response.data);
      } else {
        console.log(`Skipping update for custom field ${fieldId}: value is invalid or empty`);
      }
    } catch (error) {
      console.error(`Error updating custom field ${fieldId}:`, error);
    }
  };

  try {
    // Atualiza o EventID sozinho, se existir um valor
    if (isValidValue(eventID)) {
      await updateCustomField(customFieldEventID, eventID);
    }

    // Verifica quais partes têm valor e envia apenas as válidas
    const partsToSend = [];
    if (isValidValue(part1)) {
      await updateCustomField(customFieldIds.part1, part1);
      partsToSend.push('part1');
    }
    if (isValidValue(part2)) {
      await updateCustomField(customFieldIds.part2, part2);
      partsToSend.push('part2');
    }
    if (isValidValue(part3)) {
      await updateCustomField(customFieldIds.part3, part3);
      partsToSend.push('part3');
    }
    if (isValidValue(part4)) {
      await updateCustomField(customFieldIds.part4, part4);
      partsToSend.push('part4');
    }

    // Obter a data atual no fuso horário 'America/Sao_Paulo' e no formato 'YYYY-MM-DD'
    const currentDate = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');
    
    // Atualiza o campo personalizado com a data atual
    await updateCustomField(customFieldDate, currentDate);

    // Dispara o flow se houver pelo menos uma parte válida
    if (partsToSend.length > 0) {
      const sendFlowBody = {
        subscriber_id: userID,
        flow_ns: 'content20240826153400_489194', // Ajuste o flow_ns se necessário
      };

      const flowResponse = await axios.post(sendFlowUrl, sendFlowBody, configAxios);
      console.log('Success triggering flow with parts:', partsToSend, flowResponse.data);
    } else {
      console.log('No valid parts to update, skipping flow trigger');
    }

  } catch (error) {
    console.error('Error in updateManyChatCustomField process:', error);
  }

  console.log('Update process completed for:', userID, eventID, part1, part2, part3, part4);
}
