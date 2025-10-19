import { BadRequestError, NotFoundError } from '@/lib/errors';
import { IUser } from '@/lib/models/User';
import { generateOTP, hashText } from '@/lib/utils/crypto';
import UserService from './UserService';
import { debugPrint } from '@/lib/utils';

export default class AuthService {
	static async sendEmailOTP(email: string) {
		const user = await UserService.getOrCreateUserByEmail(email, ['email', 'otp', 'otpExpiry']);
		const otp = generateOTP();
		user.otp = hashText(otp);
		user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
		await user.save();
		debugPrint('OTP for user', user.email, 'is:', otp);
		// Send OTP email (disabled for now)
		// const emailResult = await sendOTPEmail(email, otp, user.name || email);
		// if (!emailResult.success) {
		//     throw new Error('Failed to send OTP email');
		// }
		return user;
	}

	static async loginWithEmailOTP(email: string, otp: string): Promise<IUser> {
		const user = await UserService.getUserByEmail(email, [
			'email',
			'name',
			'profilePicture',
			'otp',
			'otpExpiry',
		]);
		if (!user) {
			throw new NotFoundError();
		}
		if (user.otp !== hashText(otp)) {
			throw new BadRequestError('Invalid OTP. Please try again');
		}
		if (user.otpExpiry && user.otpExpiry < new Date()) {
			throw new BadRequestError('OTP has expired. Please request a new OTP');
		}
		user.otp = undefined;
		user.otpExpiry = undefined;
		await user.save();
		return user;
	}
}
