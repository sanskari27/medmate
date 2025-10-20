/* eslint-disable @next/next/no-img-element */
'use client';

import PageCover from '@/components/elements/PageCover';
import StartJourneyCTA from '@/components/elements/StartJourneyCTA';
import { cn } from '@/lib/utils';
import { HiCheckCircle } from 'react-icons/hi';

// blogs data removed (unused)

export default function ServicesPage() {
	return (
		<>
			<PageCover
				className='bg-image before:bg-services'
				title='Quality Healthcare, Delivered at Door'
				description='Book same-day home visits with licensed doctors. MedMate brings clinic-level care to you—safe, convenient, and personalized.'
			/>
			<div className='py-20 px-[5%] bg-slate-50'>
				<div className='max-w-6xl mx-auto'>
					<div className='max-w-3xl mx-auto text-center'>
						<h2 className='text-slate-900 text-3xl lg:text-4xl font-bold text-center mb-4 leading-relaxed'>
							Our Home Healthcare Services
						</h2>
						<p className='text-slate-600 text-sm leading-relaxed'>
							Personal, clinic‑level care—delivered where you feel most comfortable. From same‑day
							doctor consultations to skilled nursing and diagnostics at home, MedMate makes quality
							healthcare simple, safe and convenient.
						</p>
						<p className='text-slate-600 text-sm leading-relaxed mt-3'>
							We offer Doctor at Home, Nursing At Home, Diagnostic Support, Elderly Care, Chronic
							Disease Management, and Injections At Home—each tailored to your needs with
							professional teams and reliable outcomes.
						</p>
					</div>
				</div>
			</div>
			<div className='py-20 bg-slate-50'>
				<ServiceCard
					title='Doctor at home'
					description='Get access to qualified and professional doctors in the comfort of your home. Book a medical consultation and receive expert health right at your doorstep.'
					items={[
						'Get expert medical advice and treatment at home',
						'Access urgent medical care for non-critical health concerns',
						'Receive prescriptions conveniently from home',
					]}
					iconClassName='bg-doctor-at-home'
				/>
				<ServiceCard
					title='Nursing At Home'
					description='Receive professional nursing care tailored to your specific needs, ensuring recovery and comfort. From wound care to post-surgical assistance, our skilled nurses provide compassionate support right at home.'
					items={[
						'Tailored care plans focused on comfort and dignity.',
						'Receive skilled assistance for post-surgery recovery or chronic conditions.',
						'Ongoing monitoring and assistance from the comfort of your home.',
					]}
					iconClassName='bg-nursing-at-home'
				/>
				<ServiceCard
					title='Diagnostic Support'
					description='Get essential diagnostic services at your doorstep for accurate and timely health assessments. Safe, reliable sample collection and comprehensive reports for your health needs.'
					items={[
						'Samples collected from your home with utmost care.',
						'Accurate and quick results for a variety of health needs.',
						'Fully compliant with the highest quality standards.',
					]}
					iconClassName='bg-diagnostic-support'
				/>
				<ServiceCard
					title='Elderly Care Made Convenient'
					description='Empathetic, specialized care to support seniors’ health and wellbeing. Our trained caregivers and medical professionals bring comfort, dignity, and safety to your loved ones at home.'
					items={[
						'Tailored care plans for ongoing health management.',
						'Support for long-term medical needs.',
						'Professional care that brings convenience and comfort at home.',
					]}
					iconClassName='bg-elderly-care'
				/>
				<ServiceCard
					title='Chronic Disease Management'
					description='Manage chronic conditions effectively without leaving home. Personalized care, regular monitoring, and ongoing support to help you live a healthier life.'
					items={[
						'Comprehensive assessments to manage your condition better.',
						'Specialized support tailored care for diabetes, hypertension, and other chronic illnesses.',
						'Reduce hospital visits while staying on top of your health.',
					]}
					iconClassName='bg-chronic-disease'
				/>
				<ServiceCard
					title='Injections At Home'
					description='Safe and hygienic injection services delivered by qualified professionals—routine or urgent—timely and comfortable at home.'
					items={[
						'Administered by trained professionals with utmost hygiene.',
						'Avoid the hassle of travel for routine injections.',
						'Available when you need it, in the comfort of your space.',
					]}
					iconClassName='bg-injections'
				/>
			</div>
			<StartJourneyCTA />
		</>
	);
}

const ServiceCard = ({
	title,
	description,
	items,
	iconClassName,
}: {
	title: string;
	description: string;
	items: string[];
	iconClassName: string;
}) => (
	<div
		className={cn('flex flex-col md:flex-row items-center justify-center md:even:flex-row-reverse')}
	>
		<div
			className={cn(
				'w-full h-[300px] md:h-[450px] md:flex-1 bg-cover bg-no-repeat bg-center',
				iconClassName
			)}
		></div>
		<div className='md:flex-1'>
			<div className='flex flex-col px-[5%] py-16 md:px-[10%]'>
				<h3 className='font-bold text-4xl md:text-6xl'>{title}</h3>
				<p className='mt-6  md:text-xl'>{description}</p>
				<div className='mt-6'>
					<ul className='space-y-2'>
						{items.map((item) => (
							<li key={item} className='flex items-start md:items-center gap-2'>
								<HiCheckCircle className='mt-0.5 h-4 w-4 text-blue-600' />
								<span className='text-sm md:text-base'>{item}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	</div>
);
