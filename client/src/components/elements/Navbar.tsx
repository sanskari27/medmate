'use client';
import { LOGO } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import React from 'react';
import AuthDialog from './dialogs/auth';
import ProfileModal from './dialogs/profile-modal';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar() {
	const navLinks = [
		{ name: 'Services', path: '/services' },
		{ name: 'About', path: '/about' },
		{ name: 'Blogs', path: '/blogs' },
		{ name: 'Contact', path: '/contact' },
	];

	const [isScrolled, setIsScrolled] = React.useState(false);
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);
	const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
	const { data: session, status } = useSession();
	React.useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		// Initialize on mount
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div className='h-88 md:h-64'>
			<nav
				className={`fixed top-0 left-0 bg-transparent w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${
					isScrolled
						? 'bg-white/80 shadow-md text-gray-700 backdrop-blur-lg py-3 md:py-4'
						: 'py-4 md:py-6'
				}`}
			>
				{/* Logo */}
				<a href='/' className='flex items-center gap-2'>
					<Image src={LOGO} alt='logo' width={100} height={100} />
				</a>

				{/* Desktop Nav */}
				<div className='hidden md:flex items-center gap-4 lg:gap-8'>
					{navLinks.map((link, i) => (
						<a
							key={i}
							href={link.path}
							className={`group flex flex-col gap-0.5 ${
								isScrolled ? 'text-gray-700' : 'text-white'
							}`}
						>
							{link.name}
							<div
								className={`${
									isScrolled ? 'bg-gray-700' : 'bg-white'
								} h-0.5 w-0 group-hover:w-full transition-all duration-300`}
							/>
						</a>
					))}
				</div>

				{/* Desktop Right */}
				<div
					className={cn('hidden md:flex items-center gap-4', status === 'loading' && 'opacity-0')}
				>
					{session?.user ? (
						<ProfileDropdown isScrolled={isScrolled} />
					) : (
						<button
							onClick={() => setIsAuthDialogOpen(true)}
							className={`px-8 py-2.5 rounded-full ml-4 transition-all duration-500 ${
								isScrolled ? 'text-white bg-black' : 'bg-white text-black'
							}`}
						>
							Login
						</button>
					)}
				</div>

				{/* Mobile Menu Button */}
				<div className='flex items-center gap-3 md:hidden'>
					<svg
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className={`h-6 w-6 cursor-pointer ${isScrolled ? 'invert' : ''}`}
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						viewBox='0 0 24 24'
					>
						<line x1='4' y1='6' x2='20' y2='6' />
						<line x1='4' y1='12' x2='20' y2='12' />
						<line x1='4' y1='18' x2='20' y2='18' />
					</svg>
				</div>

				{/* Mobile Menu */}
				<div
					className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
						isMenuOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
				>
					<button className='absolute top-4 right-4' onClick={() => setIsMenuOpen(false)}>
						<svg
							className='h-6 w-6 bg-white'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							viewBox='0 0 24 24'
						>
							<line x1='18' y1='6' x2='6' y2='18' />
							<line x1='6' y1='6' x2='18' y2='18' />
						</svg>
					</button>

					{navLinks.map((link, i) => (
						<a key={i} href={link.path} onClick={() => setIsMenuOpen(false)}>
							{link.name}
						</a>
					))}

					{session?.user ? (
						<div className='flex flex-col items-center gap-4'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700'>
									{session?.user.email?.charAt(0).toUpperCase() || 'U'}
								</div>
								<div className='text-left'>
									<p className='text-sm font-medium text-gray-900'>{session?.user.name}</p>
									<p className='text-xs text-gray-500'>{session?.user.email}</p>
								</div>
							</div>
							<div className='flex flex-col gap-2 w-full max-w-xs'>
								<button
									onClick={() => {
										setIsProfileModalOpen(true);
										setIsMenuOpen(false);
									}}
									className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
								>
									Profile
								</button>
								<button
									onClick={() => setIsMenuOpen(false)}
									className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
								>
									Recent Bookings
								</button>
								<button
									onClick={() => setIsMenuOpen(false)}
									className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
								>
									Settings
								</button>
								<hr className='my-2' />
								<button
									onClick={async () => {
										await signOut();
										setIsMenuOpen(false);
									}}
									className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors'
								>
									Logout
								</button>
							</div>
						</div>
					) : (
						<button
							onClick={() => {
								setIsAuthDialogOpen(true);
								setIsMenuOpen(false);
							}}
							className='bg-black text-white px-8 py-2.5 rounded-full transition-all duration-500'
						>
							Login
						</button>
					)}
				</div>
			</nav>

			{/* Auth Dialog */}
			<AuthDialog
				isOpen={isAuthDialogOpen}
				onClose={() => setIsAuthDialogOpen(false)}
				onSuccess={() => setIsAuthDialogOpen(false)}
			/>

			{/* Profile Modal */}
			<ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
		</div>
	);
}
