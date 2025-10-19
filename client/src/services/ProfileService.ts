import BasicProfile, { IBasicProfile } from '@/lib/models/BasicProfile';
import MedicalProfile, { IMedicalProfile } from '@/lib/models/MedicalProfile';
import { IAuthenticatedUserInfo } from '@/lib/utils/authUtils';

export default class ProfileService {
	static async getBasicProfile(userInfo: IAuthenticatedUserInfo) {
		let basicProfile = await BasicProfile.findOne({ linkedTo: userInfo.id });
		if (!basicProfile) {
			basicProfile = new BasicProfile({ linkedTo: userInfo.id, email: userInfo.email });
			await basicProfile.save();
		}
		return basicProfile;
	}

	static async updateBasicProfile(userInfo: IAuthenticatedUserInfo, data: Partial<IBasicProfile>) {
		const basicProfile = await this.getBasicProfile(userInfo);
		basicProfile.set(data);
		await basicProfile.save();
		return basicProfile;
	}

	static async getMedicalProfile(userInfo: IAuthenticatedUserInfo) {
		let medicalProfile = await MedicalProfile.findOne({ linkedTo: userInfo.id });
		if (!medicalProfile) {
			medicalProfile = new MedicalProfile({ linkedTo: userInfo.id, email: userInfo.email });
			await medicalProfile.save();
		}
		return medicalProfile;
	}

	static async updateMedicalProfile(
		userInfo: IAuthenticatedUserInfo,
		data: Partial<IMedicalProfile>
	) {
		const medicalProfile = await this.getMedicalProfile(userInfo);
		medicalProfile.set(data);
		await medicalProfile.save();
		return medicalProfile;
	}
}
