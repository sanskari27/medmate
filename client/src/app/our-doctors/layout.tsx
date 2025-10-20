import Loading from '@/components/elements/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = {
	title: 'Our Doctors • Medmate',
	description:
		'Discover MedMate’s team of qualified home-visit doctors. Book trusted physicians online for personalized consultations, treatments, and ongoing healthcare support at home.',
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
