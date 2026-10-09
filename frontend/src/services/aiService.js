import axios from 'axios';
import api from '../api';

export const sendAiMessage = async (message, conversationId) => {
  const response = await axios.post(`${api}/api/ai/chat`, {
    message,
    conversationId,
  }, { withCredentials: true });

  return response.data;
};

export const confirmAiComplaint = async (actionToken) => {
  const response = await axios.post(`${api}/api/ai/complaints/confirm`, {
    actionToken,
  }, { withCredentials: true });

  return response.data;
};

export const cancelAiComplaint = async (actionToken) => {
  const response = await axios.post(`${api}/api/ai/complaints/cancel`, {
    actionToken,
  }, { withCredentials: true });

  return response.data;
};
