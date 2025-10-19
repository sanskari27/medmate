import CustomError from './CustomError';

const ERROR_TITLE = 'BAD_REQUEST';
const ERROR_STATUS = 400;
const ERROR_MESSAGE = 'The request is invalid or malformed.';

export default class BadRequestError extends CustomError {
	title: string;
	message: string;
	status: number;
	constructor(message: string = ERROR_MESSAGE) {
		super(message);
		Object.setPrototypeOf(this, BadRequestError.prototype);
		this.title = ERROR_TITLE;
		// Preserve the exact message value (including empty string, null, undefined)
		this.message = message;
		this.status = ERROR_STATUS;
	}

	serializeError() {
		return {
			title: this.title,
			message: this.message,
			status: this.status,
		};
	}

	override toString() {
		return 'Error: ' + this.status + ' - ' + this.title + ' - ' + this.message.toString() + '\n';
	}
}
