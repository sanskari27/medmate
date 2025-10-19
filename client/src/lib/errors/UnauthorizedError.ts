import CustomError from './CustomError';

const ERROR_TITLE = 'UNAUTHORIZED';
const ERROR_STATUS = 401;
const ERROR_MESSAGE = 'You are not authorized to access this resource.';

export default class UnauthorizedError extends CustomError {
	title: string;
	message: string;
	status: number;
	constructor(message: string = ERROR_MESSAGE) {
		super(message);
		Object.setPrototypeOf(this, UnauthorizedError.prototype);
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
