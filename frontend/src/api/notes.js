import API from "./axiosConfig";

export const getNotes = async () => {
  const res = await API.get("/notes");
  return res.data; // ✅ Return data, not response object
};

export const createNote = (data) => API.post("/notes", data);
export const updateNote = (id, data) => API.put(`/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);
