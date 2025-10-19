'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to home page since profile is now accessible via navbar modal
		router.push('/');
	}, [router]);

	return (
		<div className='bg-gray-50 min-h-screen flex items-center justify-center'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
				<p className='text-gray-600'>Redirecting to home page...</p>
			</div>
		</div>
	);
}
