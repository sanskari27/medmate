'use client';

import { cn } from '@/lib/utils';

interface PageCoverProps {
	title: string;
	description: string;
	className?: string;
}

export default function PageCover({ title, description, className }: PageCoverProps) {
	return (
		<div
			className={cn(
				'w-full bg-slate-900 text-center text-white py-40 px-[5%] flex flex-col items-center justify-center',
				className
			)}
		>
			<h1 className='max-w-2xl font-bold text-4xl/[44px] mt-2'>{title}</h1>
			<p className='text-slate-300 mt-2 text-lg max-w-3xl mx-auto'>{description}</p>
		</div>
	);
}
