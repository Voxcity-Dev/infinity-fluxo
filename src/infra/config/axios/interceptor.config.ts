import { JwtService } from '@nestjs/jwt';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from 'process';

interface ApiResponse<T> {
	data: T;
	success: boolean;
	message: string;
}

const jwt = new JwtService();

export function responseConfig<T>(response: AxiosResponse<ApiResponse<T>>): AxiosResponse {
	console.log(`[Axios Interceptor] Resposta: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
		dataOriginal: response.data,
		dataExtraida: response.data.data ?? response.data,
	});

	return {
		...response,
		data: response.data.data ?? response.data,
	};
}

export function requestConfig(request: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
	console.log(`[Axios Interceptor] Requisição: ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`, {
		params: request.params,
		data: request.data,
	});

	if (request.headers) {
		request.headers['x-microservice-token'] = jwt.sign(
			{
				key: env.JWT_KEY,
			},
			{ secret: env.MICROSERVICE_TOKEN },
		);
	}

	return request;
}
