import { ProfileDataProvider } from '@/components/context/ProfileDataProvider';
import Loading from '@/components/elements/loading';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getMedicalProfile, getUserProfile } from './actions';

export default async function ProfileLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Fetch user profile data server-side
	const [userProfile, medicalProfile] = await Promise.all([getUserProfile(), getMedicalProfile()]);

	if (!userProfile) {
		redirect('/');
	}

	return (
		<div className='bg-gray-50'>
			<Suspense fallback={<Loading />}>
				<ProfileDataProvider userProfile={userProfile} medicalProfile={medicalProfile}>
					{children}
				</ProfileDataProvider>
			</Suspense>
		</div>
	);
}
