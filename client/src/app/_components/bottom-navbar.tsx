'use client';

import { Button } from '@/components/ui/button';
import { CalendarDays, HomeIcon, User, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavbar() {
	const pathname = usePathname();
	const linkClasses = (path: string) =>
		`flex flex-col items-center ${
			pathname === path ? 'text-blue-600 font-semibold focus:text-blue-600' : 'text-gray-700 '
		}`;
	return (
		<div className='fixed bottom-0 left-0 w-full bg-white border-t shadow-md z-50'>
			<div className='grid grid-cols-4 justify-around items-center h-16'>
				<Link href='/' className={linkClasses('/')}>
					<div>
						<HomeIcon className='w-5 h-5 mb-1 mx-auto' />
						Home
					</div>
				</Link>
				<Link href='/services' className={linkClasses('/services')}>
					<div>
						<Wrench className='w-5 h-5 mb-1 mx-auto' />
						Services
					</div>
				</Link>
				<Button variant={'unstyled'} className={linkClasses('/appointments')}>
					<div>
						<CalendarDays className='w-5 h-5 mb-1 mx-auto' />
						Appointments
					</div>
				</Button>
				<Button variant={'unstyled'} className={linkClasses('/profile')}>
					<div>
						<User className='w-5 h-5 mb-1 mx-auto' />
						Profile
					</div>
				</Button>
			</div>
		</div>
	);
}
