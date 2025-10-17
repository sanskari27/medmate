'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface GoogleLoginButtonProps {
	onSuccess?: () => void;
	disabled?: boolean;
}

declare global {
	interface Window {
		google: any;
	}
}

export default function GoogleLoginButton({ onSuccess, disabled }: GoogleLoginButtonProps) {
	const { login } = useAuth();
	const googleButtonRef = useRef<HTMLDivElement>(null);
	const isGoogleLoaded = useRef(false);

	useEffect(() => {
		const loadGoogleScript = () => {
			if (window.google && isGoogleLoaded.current) return;

			const script = document.createElement('script');
			script.src = 'https://accounts.google.com/gsi/client';
			script.async = true;
			script.defer = true;
			script.onload = () => {
				if (window.google && googleButtonRef.current) {
					window.google.accounts.id.initialize({
						client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
						callback: handleCredentialResponse,
					});

					window.google.accounts.id.renderButton(googleButtonRef.current, {
						theme: 'outline',
						size: 'large',
						width: '100%',
						text: 'signin_with',
						shape: 'rectangular',
					});

					isGoogleLoaded.current = true;
				}
			};
			document.head.appendChild(script);
		};

		loadGoogleScript();
	}, []);

	const handleCredentialResponse = async (response: any) => {
		try {
			const res = await fetch('/api/auth/google', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ credential: response.credential }),
			});

			if (res.ok) {
				const data = await res.json();
				toast.success('Google login successful!');
				login(data.user);
				onSuccess?.();
			} else {
				const errorData = await res.json();
				toast.error(errorData.error || 'Google login failed');
			}
		} catch (error) {
			console.error('Google login error:', error);
			toast.error('Something went wrong. Please try again.');
		}
	};

	return (
		<div className='w-full'>
			<div ref={googleButtonRef} className='w-full' />
		</div>
	);
}
