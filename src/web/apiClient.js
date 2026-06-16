import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Single axios instance for all calls to the internal API tier.
// baseURL points at the API server (localhost in dev, the `api` service in Docker).
const apiClient = axios.create({
    baseURL: process.env.API_URL,
});

export default apiClient;
