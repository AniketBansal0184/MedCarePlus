import axios from 'axios';

const token = ''; // You’ll update this on login

const api = axios.create({
  baseURL: 'http://172.20.10.2:5000/api',
  headers: {
    Authorization: token,
  },
});

export default api;
