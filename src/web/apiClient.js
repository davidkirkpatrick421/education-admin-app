import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { requestContext } from './lib/requestContext.js';
dotenv.config();

// Single axios instance for all calls to the internal API tier.
// baseURL points at the API server (localhost in dev, the `api` service in Docker).
const apiClient = axios.create({
    baseURL: process.env.API_URL,
});

// Sign a short-lived internal JWT on every request. This proves the call came
// from the web tier (only it holds INTERNAL_JWT_SECRET) and carries the acting
// user's identity + role. Requests made while logged out (e.g. /login) send a
// service-only token so the API can still verify the caller is the web tier.
apiClient.interceptors.request.use((config) => {
    const user = requestContext.getStore()?.user;
    const payload = user
        ? { sub: user.id, role: user.role }
        : { svc: true };
    const token = jwt.sign(payload, process.env.INTERNAL_JWT_SECRET, { expiresIn: '60s' });
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default apiClient;
