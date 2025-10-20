import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
	return (
		<>
			<div className='py-14 bg-gray-900' />
			<div className=' bg-slate-50  flex items-center justify-center px-4 pt-6 pb-20'>
				<div className='max-w-2xl w-full'>
					{/* Main Container */}
					<div className='flex flex-col items-center text-center space-y-16'>
						{/* SVG Image */}
						<div>
							<div className='relative w-64 h-64 md:w-[30rem] md:h-80'>
								<Image
									src='/images/not-found.svg'
									alt='Page not found'
									fill
									className='object-contain'
									priority
								/>
							</div>

							{/* Error Content */}
							<div className='space-y-4'>
								<h2 className='text-2xl md:text-3xl font-semibold text-slate-800'>
									Page Not Found
								</h2>
								<p className='text-slate-600 text-lg max-w-md mx-auto leading-relaxed'>
									Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved. Let us help
									you find what you need.
								</p>
							</div>
						</div>

						{/* Quick Navigation Links */}
						<div className='w-full space-y-6'>
							{/* Back to Home Link */}
							<Link
								href='/'
								className='inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
							>
								← Back to Home
							</Link>

							{/* Quick Links Grid */}
						</div>

						{/* Help Section */}
						<div className='bg-white rounded-lg border border-slate-200 p-6 w-full shadow-sm'>
							<h3 className='text-lg font-semibold text-slate-900 mb-3'>Still need help?</h3>
							<p className='text-slate-600 mb-4'>
								Can&apos;t find what you&apos;re looking for? Get in touch with our team.
							</p>
							<Link
								href='/contact'
								className='inline-block px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-full transition-all duration-300 transform hover:scale-105'
							>
								Contact Us
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
