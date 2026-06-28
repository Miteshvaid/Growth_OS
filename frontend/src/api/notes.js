import API from "./axiosConfig";

export const getNotes = () => API.get("/notes");
export const createNote = (noteData) => API.post("/notes", noteData);
export const updateNote = (id, noteData) => API.put(`/notes/${id}`, noteData);
export const deleteNote = (id) => API.delete(`/notes/${id}`);
