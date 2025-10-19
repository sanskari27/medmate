const ERROR_TITLE = 'Unhandled Error.';
abstract class CustomError extends Error {
	abstract status: number;
	abstract title: string;
	abstract override message: string;
	constructor(msg: string = ERROR_TITLE) {
		super(msg);
		Object.setPrototypeOf(this, CustomError.prototype);
	}
	abstract serializeError(): {
		title: string;
		message: string;
		status: number;
	};
}

export default CustomError;
