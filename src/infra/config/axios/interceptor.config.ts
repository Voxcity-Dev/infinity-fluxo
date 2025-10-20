import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

export function responseConfig<T>(
  response: AxiosResponse<ApiResponse<T>>,
): AxiosResponse {
  return {
    ...response,
    data: response.data.data ?? response.data,
  };
}

export function requestConfig(
  request: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (request.headers) {
    request.headers['x-microservice-token'] = process.env.MICROSERVICE_TOKEN;
  }

  return request;
}