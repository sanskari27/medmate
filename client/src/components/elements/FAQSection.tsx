'use client';
import { useState } from 'react';

const faqs = [
	{
		question: 'Is MedMate available in all cities?',
		answer:
			'Currently, MedMate operates in select metropolitan areas with plans to expand soon. Check availability in your location during booking.',
	},
	{
		question: 'Are the doctors licensed and verified?',
		answer:
			'Yes, all our doctors are fully licensed, verified, and have undergone thorough background checks to ensure quality care.',
	},
	{
		question: 'Can I cancel or reschedule my appointment?',
		answer:
			'Yes, appointments can be cancelled or rescheduled up to 24 hours before the scheduled time via the app or website.',
	},
	{
		question: 'What if I need emergency medical care?',
		answer:
			'MedMate is not designed for emergencies. In urgent situations, please call emergency services immediately.',
	},
	{
		question: 'How do I prepare for a home consultation?',
		answer:
			'Please keep your medical records handy and ensure a clean, well-lit space for the doctor’s visit.',
	},
	{
		question: 'Do you provide prescriptions and medicines during the visit?',
		answer:
			'Yes, doctors can issue prescriptions and, if required, deliver medicines directly to your home.',
	},
	{
		question: 'Can I add family members to my MedMate account?',
		answer:
			'Yes, you can manage appointments and consultations for your family members through a single account.',
	},
	{
		question: 'Is my personal and medical information secure?',
		answer:
			'Absolutely. We use industry-standard encryption and privacy protocols to keep your data safe and confidential.',
	},
];

export default function FAQSection() {
	const [openIndex, setOpenIndex] = useState(-1);
	const [viewAll, setViewAll] = useState(false);

	const faqsToShow = viewAll ? faqs : faqs.slice(0, 3);

	return (
		<>
			<div className='max-w-3xl mt-12 mx-auto flex flex-col items-center justify-center px-4 md:px-0'>
				{faqsToShow.map((faq, index) => (
					<div
						className='border-b border-slate-200 py-4 cursor-pointer w-full'
						key={index}
						onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
					>
						<div className='flex items-center justify-between'>
							<h3 className='text-base font-medium'>{faq.question}</h3>
							<svg
								width='18'
								height='18'
								viewBox='0 0 18 18'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
								className={`${
									openIndex === index ? 'rotate-180' : ''
								} transition-all duration-500 ease-in-out`}
							>
								<path
									d='m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2'
									stroke='#1D293D'
									strokeWidth='1.5'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
						</div>
						<p
							className={`text-sm text-slate-500 transition-all duration-500 ease-in-out max-w-md ${
								openIndex === index
									? 'opacity-100 max-h-[300px] translate-y-0 pt-4'
									: 'opacity-0 max-h-0 -translate-y-2'
							}`}
						>
							{faq.answer}
						</p>
					</div>
				))}
				{faqsToShow.length < faqs.length && (
					<button
						type='button'
						className='flex items-center gap-2.5 border border-gray-500/30 px-4 py-2 text-sm text-gray-800 rounded bg-white hover:text-blue-400 hover:bg-blue-400/10 hover:border-blue-400/30 active:scale-95 transition mt-6'
						onClick={() => setViewAll(!viewAll)}
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 16 16'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M3.5 12.5V1.003S3.5.5 4 .5h11s.5.002.5.502v13s0 1.498-1.5 1.498H2s-1.5.002-1.5-1.998v-7.5S.5 5.5 1 5.5h1m4.5-2H9m-2.5 2h6m-6 2h6m-6 2h6m-6 2h6'
								stroke='#60A5FA'
								strokeWidth='1.2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
						View All
					</button>
				)}
			</div>
		</>
	);
}
