import CustomError from './CustomError';

const ERROR_TITLE = 'VALIDATION_ERROR';
const ERROR_STATUS = 422;
const ERROR_MESSAGE = 'The request data failed validation.';

export default class ValidationError extends CustomError {
	title: string;
	message: string;
	status: number;
	errors: Array<{ field: string; message: string }>;

	// Overload signatures
	constructor(errors: Array<{ field: string; message: string }>);
	constructor(message: string, errors?: Array<{ field: string; message: string }>);
	constructor();

	// Implementation
	constructor(
		messageOrErrors?: string | Array<{ field: string; message: string }>,
		errors?: Array<{ field: string; message: string }>
	) {
		// Determine if first argument is errors array or message string
		const isErrorsArray = Array.isArray(messageOrErrors);
		const finalMessage = isErrorsArray ? ERROR_MESSAGE : messageOrErrors || ERROR_MESSAGE;
		const finalErrors = isErrorsArray ? messageOrErrors : errors || [];

		super(finalMessage);
		Object.setPrototypeOf(this, ValidationError.prototype);
		this.title = ERROR_TITLE;
		this.message = finalMessage;
		this.status = ERROR_STATUS;
		this.errors = finalErrors;
	}

	serializeError() {
		return {
			title: this.title,
			message: this.message,
			status: this.status,
			errors: this.errors,
		};
	}

	override toString() {
		const errorDetails =
			this.errors.length > 0
				? '\nValidation errors:\n' +
					this.errors.map((e) => `  - ${e.field}: ${e.message}`).join('\n')
				: '';
		return (
			'Error: ' +
			this.status +
			' - ' +
			this.title +
			' - ' +
			this.message.toString() +
			errorDetails +
			'\n'
		);
	}
}
