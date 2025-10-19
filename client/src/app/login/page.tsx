'use client';

import AuthDialog from '@/components/elements/dialogs/auth';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
	const router = useRouter();
	const callbackUrl = useSearchParams().get('callbackUrl') ?? '/';
	return (
		<>
			<AuthDialog
				isOpen={true}
				onClose={() => router.push('/')}
				onSuccess={() => router.push(callbackUrl)}
			/>
		</>
	);
}
