'use client';

import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { useRef } from 'react';

export default function LocationInput() {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		inputRef.current?.scrollIntoView({
			behavior: 'smooth', // smooth scrolling
			block: 'start', // align to top
		});
	};

	return (
		<div className='my-8 shadow-lg rounded-full' onClick={handleClick} ref={inputRef}>
			<PlaceholdersAndVanishInput placeholders={['Find By Location']} disabled />
		</div>
	);
}
