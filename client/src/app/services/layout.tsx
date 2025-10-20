import Loading from '@/components/elements/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = {
	title: 'Services • Medmate',
	description:
		'Explore MedMate services: Doctor at Home, Nursing, Diagnostics, Elderly Care, Chronic Disease Management, Injections at Home.',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<main className=''>
			<Suspense fallback={<Loading />}>{children}</Suspense>
		</main>
	);
}
