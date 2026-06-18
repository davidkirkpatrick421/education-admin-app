import dotenv from 'dotenv';
import { createApp } from './app.js';
import './db/pool.js';

dotenv.config();

const api = createApp();
const PORT = process.env.API_PORT;

api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});

export default api;
