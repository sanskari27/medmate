import CustomError from './CustomError';

const ERROR_TITLE = 'NOT_FOUND';
const ERROR_STATUS = 404;
const ERROR_MESSAGE = 'The requested resource was not found.';

export default class NotFoundError extends CustomError {
	title: string;
	message: string;
	status: number;
	constructor(message: string = ERROR_MESSAGE) {
		super(message);
		Object.setPrototypeOf(this, NotFoundError.prototype);
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
