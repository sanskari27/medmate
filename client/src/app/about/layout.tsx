import Loading from '@/components/elements/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = {
	title: 'About • Medmate',
	description:
		'Learn about MedMate: our mission to deliver quality home healthcare and how we operate.',
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
