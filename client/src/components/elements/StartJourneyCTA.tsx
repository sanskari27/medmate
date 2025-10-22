import Link from 'next/link';

export default function StartJourneyCTA() {
	return (
		<div className='py-20 px-[5%] bg-slate-50 text-black'>
			<section className='flex flex-col items-center justify-center mx-auto px-4 md:px-0 max-w-5xl w-full text-center rounded-2xl py-20 md:py-24 bg-start-journey bg-cover bg-center bg-no-repeat'>
				<h1 className='text-3xl md:text-4xl font-medium text-white max-w-4xl'>
					Start your journey to easier, better healthcare today.
				</h1>
				<div className='h-[3px] w-64 my-1 bg-gradient-to-l from-transparent to-white'></div>
				<p className='text-sm md:text-base text-white max-w-xl mt-6'>
					Experience personalized healthcare designed for your convenience — expert care, effortless
					access, and doorstep service whenever you need it. Skip the wait, embrace comfort, and
					stay confidently cared for.
				</p>
				<Link href='/book-appointment?appointment_type=home-visit'>
					<button className='px-10 py-3 mt-4 text-sm bg-white hover:scale-105 transition duration-300 rounded-full'>
						Book Home Visit
					</button>
				</Link>
			</section>
		</div>
	);
}
