import RequestError from './RequestError';
import { debugPrint, getFormattedDateTimestamp } from './utils';

interface RequestOptions extends RequestInit {
	tags?: string[];
	userId?: string;
}

const SERVER_URL = 'http://localhost:3001/api';

const isServer = typeof window === 'undefined';

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
	let cookiesString: string | null = null;
	if (isServer) {
		const { cookies } = await import('next/headers');
		const cookieStore = cookies();
		cookiesString = cookieStore
			.getAll()
			.map((cookie) => `${cookie.name}=${cookie.value}`)
			.join('; ');
	}

	const response = await fetch(`${SERVER_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...options.headers,
			...(isServer &&
				cookiesString && {
					Cookie: cookiesString,
				}),
		},
	});

	return response;
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
	let cookiesString: string | null = null;
	let refreshToken = Math.random().toString(36).substring(2, 15);
	let userId = Math.random().toString(36).substring(2, 15);
	if (isServer) {
		const { cookies } = await import('next/headers');
		const cookieStore = cookies();
		cookiesString = cookieStore
			.getAll()
			.map((cookie) => `${cookie.name}=${cookie.value}`)
			.join('; ');
		refreshToken = cookieStore.get('refresh-cookie')?.value ?? refreshToken;
		userId = cookieStore.get('user-id')?.value ?? userId;
	}

	const response = await fetch(`${SERVER_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...options.headers,
			...(isServer &&
				cookiesString && {
					Cookie: cookiesString,
				}),
		},
		next: {
			revalidate: 3600,
			...options.next,
			tags: options.tags?.map((tag) => `${tag}-${refreshToken}`),
		},
	});

	if (!['/auth/me'].includes(path)) {
		debugPrint(
			`API - [${path}] - ${getFormattedDateTimestamp()} - ${userId} - CACHE : ${
				response.headers.get('X-Cache-Status') ?? 'HIT'
			}`
		);
	}

	if (response.ok) {
		return response.json();
	}
	throw await RequestError.fromResponse(response);
}

async function cachedRequest<T>(path: string, options: RequestOptions): Promise<T> {
	let cookiesString: string | null = null;
	let userId = Math.random().toString(36).substring(2, 15);
	if (isServer) {
		const { cookies } = await import('next/headers');
		const cookieStore = cookies();
		cookiesString = cookieStore
			.getAll()
			.map((cookie) => `${cookie.name}=${cookie.value}`)
			.join('; ');
		userId = cookieStore.get('user-id')?.value ?? userId;
	}

	const response = await fetch(`${SERVER_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...options.headers,
			...(isServer &&
				cookiesString && {
					Cookie: cookiesString,
				}),
		},
		next: {
			revalidate: 3600,
			...options.next,
			tags: options.tags,
		},
	});

	if (!['/sessions/validate-auth', '/sessions/details'].includes(path)) {
		debugPrint(
			`API - [${path}] - ${getFormattedDateTimestamp()} - ${userId} - CACHE : ${
				response.headers.get('X-Cache-Status') ?? 'HIT'
			}`
		);
	}

	if (response.ok) {
		return response.json();
	}
	throw await RequestError.fromResponse(response);
}

function getMethod<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return cachedRequest(path, {
		...options,
		method: 'GET',
	});
}

function postMethod<T>(path: string, body?: object, options: RequestOptions = {}): Promise<T> {
	return request(path, {
		...options,
		method: 'POST',
		...(body && {
			body: JSON.stringify(body),
		}),
	});
}

function patchMethod<T>(path: string, body?: object, options: RequestOptions = {}): Promise<T> {
	return request(path, {
		...options,
		method: 'PATCH',
		...(body && { body: JSON.stringify(body) }),
	});
}

function deleteMethod<T>(path: string, body?: object, options: RequestOptions = {}): Promise<T> {
	return request(path, {
		...options,
		method: 'DELETE',
		...(body && { body: JSON.stringify(body) }),
	});
}

function putMethod<T>(path: string, body?: object, options: RequestOptions = {}): Promise<T> {
	return request(path, {
		...options,
		method: 'PUT',
		...(body && { body: JSON.stringify(body) }),
	});
}

function getWithoutCacheMethod<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return cachedRequest(path, {
		...options,
		next: {
			revalidate: 0,
		},
		headers: {
			'Cache-Control': 'no-cache',
		},
	});
}

function headMethod<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return cachedRequest(path, {
		...options,
		method: 'HEAD',
	});
}

async function revalidateTag(tag: string) {
	if (isServer) {
		const { revalidateTag } = await import('next/cache');
		revalidateTag(tag);
	}
}

export const apiClient = {
	get: getMethod,
	getWithoutCache: getWithoutCacheMethod,
	head: headMethod,
	post: postMethod,
	patch: patchMethod,
	put: putMethod,
	delete: deleteMethod,
	revalidateTag,
	rawRequest,
};
