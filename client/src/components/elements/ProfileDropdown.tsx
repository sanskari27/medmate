'use client';

import { Button } from '@/components/ui/button';
import { useOutsideClick } from '@/hooks/use-outside-click';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, LogOut, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

interface ProfileDropdownProps {
	isScrolled: boolean;
}

export default function ProfileDropdown({ isScrolled }: ProfileDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { data: session } = useSession();
	const router = useRouter();
	console.log('session', session);

	useOutsideClick(dropdownRef, () => setIsOpen(false));

	const handleLogout = async () => {
		await signOut();
		setIsOpen(false);
	};

	const handleProfileClick = () => {
		// TODO: Navigate to profile page
		router.push('/profile');
		setIsOpen(false);
	};

	const handleBookingsClick = () => {
		// TODO: Navigate to bookings page
		router.push('/bookings');
		setIsOpen(false);
	};

	return (
		<div className='relative' ref={dropdownRef}>
			{/* Profile Button */}
			<Button
				variant='ghost'
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					'flex items-center gap-2 px-2 py-6 rounded-full transition-all duration-300',
					isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
				)}
			>
				{/* Profile Avatar */}
				<div
					className={cn(
						'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
						isScrolled ? 'bg-gray-200 text-gray-700' : 'bg-white/20 text-white'
					)}
				>
					{session?.user?.profilePicture ? (
						<img
							src={session?.user?.profilePicture}
							alt='Profile Picture'
							className='w-8 h-8 rounded-full'
							width={32}
							height={32}
						/>
					) : (
						session?.user?.email?.charAt(0).toUpperCase() || 'U'
					)}
				</div>
			</Button>

			{/* Dropdown Menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -10, scale: 0.95 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className='absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50'
					>
						{/* User Info Header */}
						<div className='px-4 py-3 border-b border-gray-100 dark:border-gray-700'>
							<p className='text-sm font-medium text-gray-900 dark:text-white'>
								{session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
							</p>
							<p className='text-xs text-gray-500 dark:text-gray-400'>{session?.user?.email}</p>
						</div>

						{/* Menu Items */}
						<div className='py-2'>
							<button
								onClick={handleProfileClick}
								className='w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150'
							>
								<User className='w-4 h-4' />
								Profile
							</button>

							<button
								onClick={handleBookingsClick}
								className='w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150'
							>
								<Calendar className='w-4 h-4' />
								Recent Bookings
							</button>
						</div>

						{/* Logout Section */}
						<div className='border-t border-gray-100 dark:border-gray-700 pt-2'>
							<button
								onClick={handleLogout}
								className='w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150'
							>
								<LogOut className='w-4 h-4' />
								Logout
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
