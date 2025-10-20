import axios from 'axios';

export const  api_core = axios.create({
    baseURL: process.env.API_CORE_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-microservice-token': process.env.MICROSERVICE_TOKEN,
    }
});

