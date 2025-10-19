import CustomError from './CustomError';

const ERROR_TITLE = 'SERVICE_UNAVAILABLE';
const ERROR_STATUS = 503;
const ERROR_MESSAGE = 'The service is temporarily unavailable. Please try again later.';

export default class ServiceUnavailableError extends CustomError {
	title: string;
	message: string;
	status: number;
	retryAfter: number | undefined;
	constructor(message: string = ERROR_MESSAGE, retryAfter?: number) {
		super(message);
		Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
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
