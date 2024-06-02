import axios, { type AxiosError, type AxiosResponse } from "axios";
import type {
	WPapiCoreVersionResponse,
	WPapiTemplateResponse,
} from "../types.js";

/**
 * The Axios interceptor.
 *
 *  @see https://github.com/axios/axios?tab=readme-ov-file#interceptors
 */
axios.interceptors.response.use(
	(res) => res,
	(error: AxiosError) => {
		const { data, status, config } = error.response!;
		switch (status) {
			case 400:
				console.error(data, config);
				break;

			case 401:
				console.error("unauthorised");
				break;

			case 404:
				console.error("/not-found");
				break;

			case 500:
				console.error("/server-error");
				break;
		}
		return Promise.reject(error);
	},
);

/**
 * Extracts the response data from an Axios response object.
 *
 * @param response - The Axios response object.
 * @return The response data.
 */
const responseBody = <T>(response: AxiosResponse<T>) => response.data;

/**
 * The Axios request options.
 */
const reqOptions = {
	headers: {
		"User-Agent":
			"WPMM - WordPress Package Manager https://github.com/wp-blocks/wpmm",
		"Content-Type": "application/json",
		Accept: "application/json",
		Connection: "keep-alive",
		Pragma: "no-cache",
	},
};

/**
 * Fetches data from the provided URL using Axios.
 *
 * @param url - The URL to fetch data from.
 */
const axiosFetch = {
	/**
	 * A function that performs an HTTP GET request using Axios.
	 *
	 * @param {string} url - The URL to send the GET request to.
	 * @return A promise that resolves to the response data.
	 */
	get: <T>(url: string) => axios.get<T>(url, reqOptions).then(responseBody),
	/**
	 * Sends a POST request to the specified URL with the provided body.
	 *
	 * @param {string} url - The URL to send the request to.
	 * @param {object} body - The body of the request.
	 * @return A promise that resolves to the response data.
	 */
	post: <T>(url: string, body: object) =>
		axios.post<T>(url, body, reqOptions).then(responseBody),
};

/**
 * Retrieves a template using the provided URL.
 *
 * @param url - The URL of the template.
 * @return A promise that resolves to the template data.
 */
export const getTemplate = (
	url: string,
): Promise<{ data: WPapiTemplateResponse }> =>
	axiosFetch.get<{ data: WPapiTemplateResponse }>(url);

/**
 * Fetch the WordPress version from WordPress.org
 */
export const getWpVersionCheck = (): Promise<WPapiCoreVersionResponse> =>
	axiosFetch.get<WPapiCoreVersionResponse>(
		"https://api.wordpress.org/core/version-check/1.7/",
	);
