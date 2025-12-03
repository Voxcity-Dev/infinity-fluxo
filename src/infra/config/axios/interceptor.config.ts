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
	return {
		...response,
		data: response.data.data ?? response.data,
	};
}

export function requestConfig(request: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
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
