import { NotFoundError } from '@/lib/errors';
import UserDB, { IUser } from '@/lib/models/User';
import { Types } from 'mongoose';

export default class UserService {
	static async getOrCreateUserByEmail(email: string, select: string[] = []): Promise<IUser> {
		let user =
			select.length > 0
				? await UserDB.findOne({ email }).select(select)
				: await UserDB.findOne({ email });
		if (!user) {
			user = new UserDB({ email });
			await user.save();
		}
		return user as IUser;
	}

	static async createUserByGoogle(
		email: string,
		googleId: string,
		profilePicture?: string
	): Promise<IUser> {
		let user = await this.getUserByEmail(email);
		if (user) {
			user.provider = 'google';
			user.isVerified = true;
			user.googleId = googleId;
			user.profilePicture = profilePicture;
		} else {
			user = new UserDB({ email, provider: 'google', googleId, profilePicture, isVerified: true });
		}
		await user.save();
		return user as IUser;
	}

	static async getUserByEmail(email: string, select: string[] = []): Promise<IUser | null> {
		return select.length > 0
			? (await UserDB.findOne({ email }).select(select)) ?? null
			: (await UserDB.findOne({ email })) ?? null;
	}

	static async getUserById(id: Types.ObjectId): Promise<IUser> {
		const user = await UserDB.findById(id);
		if (!user) {
			throw new NotFoundError();
		}
		return user as IUser;
	}

	static async updateUser(id: Types.ObjectId, data: Partial<IUser>): Promise<IUser> {
		const user = await this.getUserById(id);
		user.set(data);
		await user.save();
		return user as IUser;
	}
}
