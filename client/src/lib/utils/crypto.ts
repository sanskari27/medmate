import crypto from 'crypto';

export function generateOTP() {
	const n = crypto.randomInt(100_000, 1_000_000); // 100_000..999999
	return n.toString().padStart(6, '0');
}

export function hashText(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}
