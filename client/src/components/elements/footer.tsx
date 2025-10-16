import { LOGO } from '@/lib/consts';
import { Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function Footer() {
	return (
		<footer className='bg-gradient-to-b from-transparent from-0% via-primary/50 via-40% to-primary text-accent px-[5%] pt-[7rem]'>
			<div className='pt-16 pb-4 px-[7%]'>
				<div className='w-full flex flex-col md:flex-row text-center md:text-left gap-12 md:gap-8 py-[1rem] justify-between'>
					<div className='w-full md:w-1/5 flex flex-col text-center items-center justify-center md:items-start md:text-left'>
						<Image src={LOGO} alt='Medmate' width={400} height={250} className='text-white' />
					</div>
					<div className='w-full md:w-1/5 flex flex-col items-center md:items-start text-center md:text-left gap-0'>
						<p className='underline underline-offset-8 font-medium  text-slate-50 dark:text-slate-50'>
							Explore
						</p>
						<div className='mt-4'>
							<Link
								className='hover:text-slate-200 text-slate-50 dark:hover:text-slate-200 dark:text-slate-50 '
								href='/terms'
							>
								<p>Home Visit</p>
							</Link>
							<Link
								className='hover:text-slate-200 text-slate-50 dark:hover:text-slate-200 dark:text-slate-50 '
								href='/privacy'
							>
								<p>Consultation</p>
							</Link>
							<Link
								className='hover:text-slate-200 text-slate-50 dark:hover:text-slate-200 dark:text-slate-50 '
								href='/privacy'
							>
								<p>Services</p>
							</Link>
							<Link
								className='hover:text-slate-200 text-slate-50 dark:hover:text-slate-200 dark:text-slate-50 '
								href='/disclaimer'
							>
								<p>Contact Us</p>
							</Link>
						</div>
					</div>
					<div className='w-full md:w-2/5 flex flex-col items-center md:items-start text-center md:text-left'>
						<Link href='/consultation'>
							<Button
								variant={'secondary'}
								className='pr-8 pl-10 relative group dark:bg-slate-100 dark:hover:bg-slate-100 dark:text-slate-900 dark:hover:text-slate-900 '
							>
								Book A Consultation
								<Phone className='w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-all duration-300' />
							</Button>
						</Link>
						<div className='mt-4 text-slate-50 dark:text-slate-50'>
							<p>Stellar Coaching & Consulting</p>
							<p>B-502, Sahara Apartment, Plot No. 11,</p>
							<p>Sector 6 Dwarka, Dwarka,</p>
							<p>New Delhi, Delhi 110075, India</p>
						</div>
					</div>
				</div>
				<div className='flex flex-col md:flex-row items-center justify-center mt-8 w-full'>
					<p className='px-4 text-center text-gray-100 dark:text-gray-100'>
						Copyright © medmate.in
					</p>
				</div>
			</div>
		</footer>
	);
}
