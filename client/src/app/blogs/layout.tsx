import Loading from '@/components/elements/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = {
	title: 'Blogs • Medmate',
	description: `Read our latest blogs and stay updated with the latest news and insights from Medmate.`,
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
