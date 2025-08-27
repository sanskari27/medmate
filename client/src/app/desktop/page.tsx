import FAQ from '@/components/elements/faq';
import ServicesCard from '@/components/elements/services-card';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import { DirectionAwareHover } from '@/components/ui/direction-aware-hover';
import { FeaturesSectionDemo } from '@/components/ui/simple-hover-effect';
import {
	FAQ_IMG,
	HERO_IMAGE,
	HOME_VISIT_IMAGE,
	LAB_AT_HOME_IMAGE,
	NURSING_AT_HOME_IMAGE,
	OPD_CONSULTATION_IMAGE,
} from '@/lib/consts';
import { homeFaqs } from '@/mock/faq';
import Image from 'next/image';
import Link from 'next/link';

const people = [
	{
		id: 1,
		name: 'John Doe',
		designation: 'Software Engineer',
		image:
			'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80',
	},
	{
		id: 2,
		name: 'Robert Johnson',
		designation: 'Product Manager',
		image:
			'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
	},
	{
		id: 3,
		name: 'Jane Smith',
		designation: 'Data Scientist',
		image:
			'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
	},
	{
		id: 4,
		name: 'Emily Davis',
		designation: 'UX Designer',
		image:
			'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
	},
	{
		id: 5,
		name: 'Tyler Durden',
		designation: 'Soap Developer',
		image:
			'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80',
	},
	{
		id: 6,
		name: 'Dora',
		designation: 'The Explorer',
		image:
			'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3534&q=80',
	},
];

export default async function Home() {
	return (
		<main className='px-8 flex flex-col items-center justify-center gap-8'>
			{/* -------------------hero section------------------- */}
			<div className='flex min-h-screen flex-col justify-center overflow-hidden w-full rounded-md z-0 '>
				<div className='flex w-full flex-1 justify-center z-0 flex-col'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-4 md:px-8 justify-center'>
						<div className='text-center md:text-left col-span-1 lg:col-span-2 mt-8 md:mt-[10%] flex flex-col gap-4'>
							<div className='text-4xl font-medium mb-8'>
								<p>Priorities your health Experience</p>
								<p>with Exceptional Care.</p>
							</div>
							<p>
								Experience quality healthcare services at your doorstep – from doctor visits and lab
								tests to home nursing and OPD consultations. Convenient, reliable, and trusted by
								1345+ happy patients.
							</p>
							<div className='grid grid-cols-2 md:grid-cols-4 items-start justify-center md:justify-start gap-4 mt-8'>
								<div className='relative flex items-center justify-center'>
									<DirectionAwareHover
										imageUrl={HOME_VISIT_IMAGE}
										className='!w-[10rem] !h-[10rem]'
									>
										<p className='font-bold'>Doctor Home Visit</p>
										<Link href='/home-visit'>
											<Button className='h-min py-0 px-2'>Book Now</Button>
										</Link>
									</DirectionAwareHover>
								</div>
								<div className='relative flex items-center justify-center'>
									<DirectionAwareHover
										imageUrl={LAB_AT_HOME_IMAGE}
										className='!w-[10rem] !h-[10rem]'
									>
										<p className='font-bold'>Lab Test at Home</p>
										<Link href='/home-visit'>
											<Button className='h-min py-0 px-2'>Book Now</Button>
										</Link>
									</DirectionAwareHover>
								</div>
								<div className='relative flex items-center justify-center'>
									<DirectionAwareHover
										imageUrl={NURSING_AT_HOME_IMAGE}
										className='!w-[10rem] !h-[10rem]'
									>
										<p className='font-bold'>Nursing at Home</p>
										<Link href='/home-visit'>
											<Button className='h-min py-0 px-2'>Book Now</Button>
										</Link>
									</DirectionAwareHover>
								</div>
								<div className='relative flex items-center justify-center'>
									<DirectionAwareHover
										imageUrl={OPD_CONSULTATION_IMAGE}
										className='!w-[10rem] !h-[10rem]'
									>
										<p className='font-bold'>OPD consultation</p>
										<Link href='/consultation'>
											<Button className='h-min py-0 px-2'>Book Now</Button>
										</Link>
									</DirectionAwareHover>
								</div>
							</div>
							<div className='lg:hidden  h-min flex items-center justify-center flex-row bg-white p-4 rounded-lg shadow-lg gap-4'>
								<div>
									<div>Our Patients</div>
									<div className='flex items-center justify-center'>
										<AnimatedTooltip items={people} />
									</div>
								</div>
								<div className='bg-primary text-white rounded-lg p-4 flex flex-col items-center justify-center ml-4 text-center '>
									<div>+1345</div>
									<div>Happy Patients</div>
								</div>
							</div>
						</div>
						<div className='relative hidden md:block h-full'>
							<Image
								src={HERO_IMAGE}
								width={390}
								height={540}
								alt=''
								className='min-h-full aspect-auto'
							/>
							<div className='absolute -z-10 right-0 bottom-0 h-[70%] w-[50%] bg-primary rounded-xl'></div>
							<div className='absolute  hidden top-[80%]  h-min -left-[50%] lg:flex items-center justify-center flex-row bg-white p-4 rounded-lg shadow-lg gap-4'>
								<div>
									<div>Our Patients</div>
									<div className='flex items-center justify-center'>
										<AnimatedTooltip items={people} />
									</div>
								</div>
								<div className='bg-primary text-white rounded-lg p-4 flex flex-col items-center justify-center ml-4 text-center '>
									<div>+1345</div>
									<div>Happy Patients</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* ------------------- services section----------------------- */}
			<div className='flex flex-col items-center justify-center gap-8 w-full min-h-screen'>
				<div className='text-3xl text-center mb-4 flex flex-col items-center justify-center gap-8'>
					Compassionate Care, Anytime, Anywhere
				</div>
				<ServicesCard />
			</div>
			{/* -------------------------features------------------------- */}
			<div className='min-h-screen flex flex-col items-center justify-center gap-8 w-full'>
				<div className='text-3xl text-center'>Why Choose Us</div>
				<FeaturesSectionDemo />
			</div>
			{/* --------------------------testimonials------------------- */}
			{/* <div>
				<div className='text-center text-3xl max-w-screen'>Testimonials</div>
				<div>
					<InfiniteMovingCards items={testimonials} className='max-w-[90vw] ' />
				</div>
			</div> */}
			{/* ---------------------------FAQ--------------------------- */}
			<section
				id='faq'
				className='w-full min-h-screen flex flex-col items-center justify-center gap-8'
			>
				<p className='text-center text-4xl font-medium'>FAQ</p>
				<div className='flex flex-row items-center justify-center md:gap-8 w-full'>
					<div>
						<Image
							src={FAQ_IMG}
							alt='FAQ'
							width={500}
							height={300}
							className='mb-8 hidden lg:block'
						/>
					</div>

					<div className='mt-[5%]'>
						<div>
							<div className=''>
								<FAQ items={homeFaqs} />
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
