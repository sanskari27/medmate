import CustomError from './CustomError';

const ERROR_TITLE = 'CONFLICT';
const ERROR_STATUS = 409;
const ERROR_MESSAGE = 'The request conflicts with the current state of the resource.';

export default class ConflictError extends CustomError {
	title: string;
	message: string;
	status: number;
	constructor(message: string = ERROR_MESSAGE) {
		super(message);
		Object.setPrototypeOf(this, ConflictError.prototype);
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
