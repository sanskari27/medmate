import { LOGO } from '@/lib/consts';
import Image from 'next/image';

export default function Footer() {
	return (
		<footer className='w-full bg-gradient-to-b from-slate-50 to-[#9fa9ff] text-gray-800'>
			<div className='max-w-7xl mx-auto px-6 py-16 flex flex-col items-center'>
				<div className='flex items-center space-x-3 mb-6'>
					<Image alt='' className='h-24' src={LOGO} width={100} height={100} />
				</div>
				<p className='text-center text-xl font-normal leading-relaxed'>
					“Your health, your comfort — trusted care delivered to your doorstep.”
				</p>
			</div>
			<div className='border-t border-slate-200'>
				<div className='max-w-7xl mx-auto px-6 py-6 text-center text-sm font-normal'>
					<a href='/'>medmate.com</a> ©2025. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
