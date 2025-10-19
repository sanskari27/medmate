import CustomError from './CustomError';

const ERROR_TITLE = 'TOO_MANY_REQUESTS';
const ERROR_STATUS = 429;
const ERROR_MESSAGE = 'Too many requests. Please try again later.';

export default class TooManyRequestsError extends CustomError {
	title: string;
	message: string;
	status: number;
	retryAfter: number | undefined;
	constructor(message: string = ERROR_MESSAGE, retryAfter?: number) {
		super(message);
		Object.setPrototypeOf(this, TooManyRequestsError.prototype);
		this.title = ERROR_TITLE;
		this.message = message;
		this.status = ERROR_STATUS;
		this.retryAfter = retryAfter;
	}

	serializeError() {
		return {
			title: this.title,
			message: this.message,
			status: this.status,
			...(this.retryAfter && { retryAfter: this.retryAfter }),
		};
	}

	override toString() {
		const retryInfo = this.retryAfter ? ` Retry after: ${this.retryAfter} seconds.` : '';
		return (
			'Error: ' +
			this.status +
			' - ' +
			this.title +
			' - ' +
			this.message.toString() +
			retryInfo +
			'\n'
		);
	}
}
