import axios, { AxiosError, AxiosResponse } from 'axios';
import { WPapiCoreVersionResponse, WPapiTemplateResponse } from '../types'

axios.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
        const { data, status, config } = error.response!;
        switch (status) {
            case 400:
                console.error(data, config);
                break;

            case 401:
                console.error('unauthorised');
                break;

            case 404:
                console.error('/not-found');
                break;

            case 500:
                console.error('/server-error');
                break;
        }
        return Promise.reject(error);
    }
);

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

const reqOptions = {
    headers: {
        'User-Agent':
            'WPMM - WordPress Package Manager https://github.com/wp-blocks/wpmm',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
    },
}

export const axiosFetch = {
    get: <T>(url: string) => axios.get<T>(url, reqOptions).then(responseBody),
    post: <T>(url: string, body: object) =>
        axios.post<T>(url, body, reqOptions).then(responseBody),
};

/**
 * Retrieves a template using the provided URL.
 *
 * @param url - The URL of the template.
 * @return A promise that resolves to the template data.
 */
export const getTemplate = (url: string): Promise<{ data: WPapiTemplateResponse }> =>
    axiosFetch.get<{ data: WPapiTemplateResponse }>(url)


/**
 * Fetch the WordPress version from WordPress.org
 */
export const getWpVersionCheck = (): Promise<WPapiCoreVersionResponse> =>
    axiosFetch.get<WPapiCoreVersionResponse>('https://api.wordpress.org/core/version-check/1.7/')
