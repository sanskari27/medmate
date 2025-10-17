'use client';

import { MedicalProfileData, UserProfile } from '@/types/profile';
import { createContext, ReactNode, useContext } from 'react';

interface ProfileDataContextType {
	userProfile: UserProfile;
	medicalProfile: MedicalProfileData | null;
}

const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);

export function ProfileDataProvider({
	children,
	userProfile,
	medicalProfile,
}: {
	children: ReactNode;
	userProfile: UserProfile;
	medicalProfile: MedicalProfileData | null;
}) {
	return (
		<ProfileDataContext.Provider value={{ userProfile, medicalProfile }}>
			{children}
		</ProfileDataContext.Provider>
	);
}

export function useProfileData() {
	const context = useContext(ProfileDataContext);
	if (context === undefined) {
		throw new Error('useProfileData must be used within a ProfileDataProvider');
	}
	return context;
}
