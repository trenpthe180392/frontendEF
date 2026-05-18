export const setToken = (token) => {
  localStorage.setItem("access_token", token);
};

export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const clearToken = () => {
  localStorage.removeItem("access_token");
};