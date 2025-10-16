'use client';
import { LOGO } from '@/lib/consts';
import Image from 'next/image';
import React from 'react';

export default function Navbar() {
	const navLinks = [
		{ name: 'Home', path: '/' },
		{ name: 'Products', path: '/' },
		{ name: 'Contact', path: '/' },
		{ name: 'About', path: '/' },
	];

	const [isScrolled, setIsScrolled] = React.useState(false);
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
				<div className='hidden md:flex items-center gap-4'>
					<button
						className={`px-8 py-2.5 rounded-full ml-4 transition-all duration-500 ${
							isScrolled ? 'text-white bg-black' : 'bg-white text-black'
						}`}
					>
						Login
					</button>
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

					<button className='bg-black text-white px-8 py-2.5 rounded-full transition-all duration-500'>
						Login
					</button>
				</div>
			</nav>
		</div>
	);
}
