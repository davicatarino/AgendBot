// services/google/eventFunctions.js
import { handleEvent } from './handleEvent';
import { handleAvailable } from './HandleAvailable.js';
import { handleDelete } from './handleDelete.js';

/**
 * Função para criar um evento no Google Calendar.
 * @param {Object} args - Argumentos necessários para criar o evento.
 * @returns {Object} Resultado da criação do evento ou erro.
 */
export async function handleEventFunction(args) {
  try {
    const result = await handleEvent(args);
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Função para recuperar horários disponíveis.
 * @param {Object} args - Argumentos necessários (se houver).
 * @returns {Object} Horários disponíveis ou erro.
 */
export async function handleAvailableFunction(args) {
  try {
    const result = await handleAvailable(args);
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Função para cancelar um evento no Google Calendar.
 * @param {Object} args - Argumentos necessários para cancelar o evento.
 * @returns {Object} Resultado do cancelamento ou erro.
 */
export async function handleDeleteFunction(args) {
  try {
    const result = await handleDelete(args);
    return result;
  } catch (error) {
    return { error: error.message };
  }
}
