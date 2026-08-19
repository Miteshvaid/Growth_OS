import API from "./axiosConfig";

export const generateQuizFromNote = (noteId) =>
  API.post(`/ai/generate-quiz/${noteId}`);
