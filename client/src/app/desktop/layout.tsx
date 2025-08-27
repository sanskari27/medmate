import PageLayout from '@/components/containers/page-layout';
import Navbar from '@/components/elements/Navbar';
import PrefetchRoutes from '@/components/elements/PrefetchRoutes';
import Footer from '@/components/elements/footer';
import Loading from '@/components/elements/loading';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const poppins = Poppins({ weight: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Medmate',
	description: `Medmate provides businesses with advanced WhatsApp Business API solutions, enabling seamless bulk messaging, automated chatbots, and intuitive 2-way communication. Perfect for enhancing customer engagement, supporting multiple agents, and delivering personalized experiences at scale. Sign up today and revolutionize your business communication with Medmate.`,
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning className='overflow-x-hidden'>
			<link rel='shortcut icon' href='/icons/favicon.ico' />
			<link rel='apple-touch-icon' sizes='180x180' href='/icons/apple-touch-icon.png' />
			<link rel='icon' type='image/png' sizes='32x32' href='/icons/favicon-32x32.png' />
			<link rel='icon' type='image/png' sizes='16x16' href='/icons/favicon-16x16.png' />
			<body className={cn('min-h-screen min-w-screen', poppins.className)}>
				<ThemeProvider
					attribute='class'
					defaultTheme='light'
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<PrefetchRoutes />
						<PageLayout>
							<TooltipProvider>
								<Navbar />
								{/* <DotBackgroundDemo> */}
								<Suspense fallback={<Loading />}>{children}</Suspense>
								{/* </DotBackgroundDemo> */}
								<Footer />
							</TooltipProvider>
						</PageLayout>
						<Toaster position='top-center' />
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
