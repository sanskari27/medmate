'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';

export default function GoogleLoginButton() {
	const callbackUrl = useSearchParams().get('callbackUrl') ?? '/';

	return (
		<div className='w-full flex items-center justify-center'>
			<button
				type='button'
				className='w-full flex items-center gap-2 justify-center my-3 bg-white border border-gray-500/30 py-2.5 rounded-xl text-gray-800'
				onClick={() =>
					signIn('google', {
						redirect: true,
						callbackUrl,
					})
				}
			>
				<FcGoogle className='h-4 w-4' />
				Log in with Google
			</button>
		</div>
	);
}
