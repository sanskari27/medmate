import Loading from '@/components/elements/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = {
	title: 'Contact • Medmate',
	description: `Contact us for any questions or inquiries about our services and products.`,
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
