import CustomError from './CustomError';

const ERROR_TITLE = 'INTERNAL_SERVER_ERROR';
const ERROR_STATUS = 500;
const ERROR_MESSAGE = 'An unknown error occurred.';
const ERROR_MESSAGE_WITH_ERROR = 'An unknown error occurred. Error: %s';

export default class ServerError extends CustomError {
	title: string;
	message: string;
	status: number;
	error: any;
	constructor(message: string = ERROR_MESSAGE, err: any = null) {
		super(message);
		Object.setPrototypeOf(this, ServerError.prototype);
		this.title = ERROR_TITLE;
		// Only override message with default+error format if using default message and err is provided
		if (message === ERROR_MESSAGE && err !== null && err !== undefined) {
			this.message = ERROR_MESSAGE_WITH_ERROR.replace('%s', err);
		} else {
			this.message = message;
		}
		this.status = ERROR_STATUS;
		// Store error exactly as passed
		this.error = err;
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
