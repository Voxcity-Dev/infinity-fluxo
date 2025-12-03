import axios from 'axios';
import { requestConfig, responseConfig } from './interceptor.config';

export const api_core = axios.create({
	baseURL: process.env.API_CORE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

api_core.interceptors.request.use(requestConfig);
api_core.interceptors.response.use(responseConfig);
