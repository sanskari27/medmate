'use server';
import { apiClient } from '@/lib/apiClient';
import { MedicalProfileData, UserProfile } from '@/types/profile';

export async function getUserProfile(): Promise<UserProfile | null> {
	const response = await apiClient.get<{ user: UserProfile }>('/profile/basic');
	return response.user;
}

export async function getMedicalProfile(): Promise<MedicalProfileData | null> {
	const response = await apiClient.get<{ data: MedicalProfileData }>('/profile/medical');
	return response.data;
}
