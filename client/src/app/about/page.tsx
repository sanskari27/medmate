/* eslint-disable @next/next/no-img-element */
'use client';

import PageCover from '@/components/elements/PageCover';
import { TEAM_IMAGE } from '@/lib/consts';
import Image from 'next/image';
import Link from 'next/link';
import { BiSupport } from 'react-icons/bi';
import { FaUserMd } from 'react-icons/fa';
import { HiOutlineGlobeAlt } from 'react-icons/hi';
import { IoChatbubblesSharp } from 'react-icons/io5';
import { MdSpeed } from 'react-icons/md';
import { RiShieldCheckFill } from 'react-icons/ri';

// blogs data removed (unused)

export default function ContactPage() {
	return (
		<>
			<PageCover
				title='Home is the New Clinic'
				description='MedMate lets you book home visits from licensed doctors in minutes.'
			/>
			<div className='py-20 px-[5%]'>
				<div className='max-w-6xl mx-auto'>
					<div className='max-w-3xl mx-auto text-center'>
						<h2 className='text-slate-900 text-3xl lg:text-4xl font-bold text-center mb-4 leading-relaxed'>
							Why <span className='text-primary'>Medmate</span> exists
						</h2>
						<p className='text-slate-600 text-sm leading-relaxed'>
							India ranks among <span className='text-black font-semibold'>Top 3</span> in the
							Medical tourism destinations in Asia, but citizens struggle to find accessible
							healthcare. The healthcare sector is poised to grow into a{' '}
							<span className='text-black font-semibold'>$610 billion industry by 2026 </span>, but
							the innovation in primary curative care remains insufficient.
						</p>
						<p className='text-slate-600 text-xl font-bold leading-relaxed mt-3'>
							At Medmate, we are here to bridge this gap.
						</p>
					</div>
				</div>
				<div className='flex items-center justify-center flex-wrap gap-6 mt-20 px-4 md:px-0'>
					<WhyMedmateCard
						title='Real-Time Analytics'
						description='Get instant insights into your finances with live dashboards.'
						icon={<FaUserMd className='w-full h-full text-black' />}
					/>
					<WhyMedmateCard
						title='Real-Time Analytics'
						description='Get instant insights into your finances with live dashboards.'
						icon={<FaUserMd className='w-full h-full text-black' />}
					/>
					<WhyMedmateCard
						title='Real-Time Analytics'
						description='Get instant insights into your finances with live dashboards.'
						icon={<FaUserMd className='w-full h-full text-black' />}
					/>
				</div>
			</div>
			<div className='py-20 px-[5%] bg-gray-900 text-white'>
				<div className='max-w-6xl mx-auto'>
					<div className='max-w-3xl mx-auto mb-24 text-center'>
						<h2 className='text-slate-100 text-3xl lg:text-4xl font-bold text-center mb-4 leading-relaxed'>
							Discover Our Exclusive Features
						</h2>
						<p className='text-slate-300 text-sm leading-relaxed'>
							Empowering healthcare with innovation and compassion. Explore how our advanced
							features enhance care delivery, ensure safety, and make healthcare more personal,
							accessible, and reliable.
						</p>
					</div>

					<div className='grid lg:grid-cols-3 md:grid-cols-2 gap-12'>
						{/* Personalized Care */}
						<FeatureCard
							title='Personalized Care'
							description='Every patient is unique — and so is their care. Our platform adapts to your specific health needs, preferences, and goals, ensuring truly personalized medical experiences.'
							icon={<FaUserMd className='w-full h-full text-black' />}
						/>
						<FeatureCard
							title='Advanced Security'
							description='Your health data deserves the highest level of protection. We use cutting-edge encryption, secure storage, and real-time monitoring to safeguard every medical record and interaction.'
							icon={<RiShieldCheckFill className='w-full h-full text-black' />}
						/>
						<FeatureCard
							title='24/7 Expert Support'
							description='From onboarding to ongoing care, our dedicated medical and technical teams are available around the clock to assist you — because your well-being never takes a break.'
							icon={<BiSupport className='w-full h-full text-black' />}
						/>
						<FeatureCard
							title='Seamless Performance'
							description='Enjoy smooth, reliable, and fast access to healthcare services. Whether booking consultations or managing reports, our system ensures zero downtime and uninterrupted care.'
							icon={<MdSpeed className='w-full h-full text-black' />}
						/>
						<FeatureCard
							title='Nationwide Reach'
							description='Access trusted medical professionals and healthcare services anytime, anywhere. Our expanding network ensures quality care reaches you — no matter where you are.'
							icon={<HiOutlineGlobeAlt className='w-full h-full text-black' />}
						/>
						<FeatureCard
							title='Integrated Communication'
							description='Stay connected with your doctors, caregivers, and loved ones through secure messaging and updates. Our platform fosters transparent, coordinated communication for better outcomes.'
							icon={<IoChatbubblesSharp className='w-full h-full text-black' />}
						/>
					</div>
				</div>
			</div>

			<div className='py-20 bg-gray-900 text-white'>
				<div className='bg-gray-900 max-w-screen-xl mx-auto'>
					<div className='grid md:grid-cols-2 gap-4 items-center md:max-h-[475px] overflow-hidden'>
						<div className='relative w-full h-full md:min-h-[470px]'>
							<Image
								src={TEAM_IMAGE}
								alt='Team Image'
								className='w-full h-full object-cover shrink-0 rounded-lg'
								width={500}
								height={500}
							/>
							<span className='w-full h-full absolute inset-0 bg-gray-900 opacity-30'></span>
						</div>
						<div className='p-6 max-w-xl mx-auto max-md:text-center'>
							<h2 className='sm:text-4xl text-3xl font-bold text-blue-500 !leading-tight'>
								Take the Next Step with Confidence
							</h2>
							<div className='mt-6'>
								<p className='text-[15px] text-slate-300 leading-relaxed'>
									Step into a healthier tomorrow with care you can trust. We&apos;re here to support
									every patient&apos;s journey — whether it&apos;s a first consultation, ongoing
									treatment, or preventive care.
								</p>
								<p className='mt-2 text-[15px] text-slate-300 leading-relaxed'>
									From personalized guidance to expert-backed medical support, every service is
									designed to empower you, putting your well-being first and ensuring you never feel
									alone in your healthcare journey.
								</p>
							</div>
							{/* <button
								type='button'
								className='px-5 py-3 mt-8 rounded-sm cursor-pointer text-white text-sm tracking-wider font-medium border-none outline-none bg-gray-600 hover:bg-gray-700'
							>
								Get started
							</button> */}
							<div className='flex items-center gap-4 mt-8'>
								<Link href='/book-appointment?appointment_type=home-visit'>
									<button className='px-5 py-3 mt-8 rounded-sm cursor-pointer text-white text-sm tracking-wider font-medium border-none outline-none bg-blue-600 hover:bg-blue-700'>
										Book Home Visit
									</button>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='py-20 px-[5%] bg-slate-50 hidden md:block'>
				<h1 className='text-3xl font-semibold text-center mx-auto'>Moments That Define Our Care</h1>
				<p className='text-sm text-slate-500 text-center mt-2 max-w-lg mx-auto'>
					A glimpse into the heart of our work — real interactions, real care, and the stories of
					patients and professionals who make every moment meaningful.
				</p>
				<div className='flex items-center gap-2 h-[400px] w-full max-w-6xl mt-10 mx-auto'>
					<div className='relative group flex-grow transition-all w-64 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full'>
						<img
							className='h-full w-full object-cover object-center'
							src='https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&h=800&w=800&auto=format&fit=crop'
							alt='image'
						/>
					</div>
					<div className='relative group flex-grow transition-all w-64 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full'>
						<img
							className='h-full w-full object-cover object-center'
							src='https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&h=800&w=800&auto=format&fit=crop'
							alt='image'
						/>
					</div>
					<div className='relative group flex-grow transition-all w-64 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full'>
						<img
							className='h-full w-full object-cover object-center'
							src='https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&h=800&w=800&auto=format&fit=crop'
							alt='image'
						/>
					</div>
					<div className='relative group flex-grow transition-all w-64 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full'>
						<img
							className='h-full w-full object-cover object-center'
							src='https://images.unsplash.com/photo-1729086046027-09979ade13fd?q=80&h=800&w=800&auto=format&fit=crop'
							alt='image'
						/>
					</div>
					<div className='relative group flex-grow transition-all w-64 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full'>
						<img
							className='h-full w-full object-cover object-center'
							src='https://images.unsplash.com/photo-1601568494843-772eb04aca5d?q=80&h=800&w=800&auto=format&fit=crop'
							alt='image'
						/>
					</div>
					<div className='relative group flex-grow transition-all w-64 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full'>
						<img
							className='h-full w-full object-cover object-center'
							src='https://images.unsplash.com/photo-1585687501004-615dfdfde7f1?q=80&h=800&w=800&auto=format&fit=crop'
							alt='image'
						/>
					</div>
				</div>
			</div>
		</>
	);
}

const FeatureCard = ({
	title,
	description,
	icon,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
}) => (
	<div className='text-center'>
		<div className='w-12 h-12 p-3 rounded-md flex items-center justify-center mx-auto bg-blue-50 mb-6'>
			{icon}
		</div>
		<h3 className='text-slate-100 text-lg font-semibold mb-3'>{title}</h3>
		<p className='text-slate-400 text-sm leading-relaxed'>{description}</p>
	</div>
);

const WhyMedmateCard = ({
	title,
	description,
	icon,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
}) => (
	<div className='flex flex-col text-center items-center justify-center rounded-xl p-6 bg-green-50 border border-slate-300 gap-6 max-w-sm'>
		<div className='p-6 aspect-square bg-violet-100 rounded-full'>{icon}</div>
		<div className='space-y-2'>
			<h3 className='text-base font-semibold text-slate-700'>{title}</h3>
			<p className='text-sm text-slate-600'>{description}</p>
		</div>
	</div>
);
