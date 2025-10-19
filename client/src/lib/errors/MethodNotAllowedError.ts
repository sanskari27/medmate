import CustomError from './CustomError';

const ERROR_TITLE = 'METHOD_NOT_ALLOWED';
const ERROR_STATUS = 405;
const ERROR_MESSAGE = 'The HTTP method is not allowed for this resource.';

export default class MethodNotAllowedError extends CustomError {
	title: string;
	message: string;
	status: number;
	constructor(message: string = ERROR_MESSAGE) {
		super(message);
		Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
		this.title = ERROR_TITLE;
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
