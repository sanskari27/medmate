import Loading from '@/components/elements/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Login - Medmate',
	description:
		'Login to your Medmate account to access your dashboard and manage your appointments.',
};

export default async function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main>
			<Suspense fallback={<Loading />}>{children}</Suspense>
		</main>
	);
}
