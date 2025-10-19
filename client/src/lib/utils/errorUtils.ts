import { ZodError, ZodIssue } from 'zod';
import { CustomError } from '../errors';

export function parseErrors(error: ZodError): Array<{ field: string; message: string }> {
	return error.issues.map((issue: ZodIssue) => {
		const field = issue.path
			.map((segment, index) => {
				if (typeof segment === 'number') {
					return `[${segment}]`;
				}
				return index === 0 ? segment : `.${segment?.toString()}`;
			})
			.join('')
			.replace(/\.\[/g, '[');
		return {
			field: field || 'root',
			message: issue.message,
		};
	});
}

export const validationErrors = (errors: ZodError) => {
	return {
		success: false,
		status: 'error',
		title: 'VALIDATION_ERROR',
		errors: parseErrors(errors),
	};
};

export const internalServerError = (error?: any) => {
	return {
		success: false,
		status: 'error',
		title: 'INTERNAL_SERVER_ERROR',
		message: 'An unknown error occurred.',
		error: error?.message || 'An unknown error occurred.',
	};
};

export const serializeError = (error: CustomError) => {
	return {
		success: false,
		...error.serializeError(),
	};
};
