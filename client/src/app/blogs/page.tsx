/* eslint-disable @next/next/no-img-element */

import NewsLetter from '@/components/elements/NewsLetter';
import StartJourneyCTA from '@/components/elements/StartJourneyCTA';

const blogs = [
	{
		title: 'Mental Health in the Digital Age: A Medical Perspective',
		image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
		date: '12 JAN 2024',
		author: 'Dr. Michael Rodriguez',
	},
	{
		title: 'Preventive Medicine: Your First Line of Defense',
		image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop',
		date: '10 JAN 2024',
		author: 'Dr. Emily Watson',
	},
	{
		title: 'The Science Behind Chronic Disease Management',
		image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
		date: '8 JAN 2024',
		author: 'Dr. James Thompson',
	},
	{
		title: 'Nutrition and Medicine: A Holistic Approach',
		image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
		date: '5 JAN 2024',
		author: 'Dr. Lisa Park',
	},
	{
		title: 'Emergency Medicine: When Every Second Counts',
		image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop',
		date: '3 JAN 2024',
		author: 'Dr. Robert Kim',
	},
	{
		title: 'Pediatric Care: Specialized Medicine for Children',
		image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=600&fit=crop',
		date: '1 JAN 2024',
		author: 'Dr. Maria Garcia',
	},
	{
		title: 'Cardiology Advances: Heart Health in 2024',
		image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop',
		date: '29 DEC 2023',
		author: 'Dr. David Wilson',
	},
	{
		title: 'Oncology Research: Breakthrough Treatments',
		image:
			'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600&q=80',
		date: '27 DEC 2023',
		author: 'Dr. Jennifer Lee',
	},
	{
		title: 'Geriatric Medicine: Caring for Our Aging Population',
		image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
		date: '25 DEC 2023',
		author: 'Dr. Patricia Brown',
	},
	{
		title: 'Digital Health Records: Improving Patient Care',
		image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
		date: '23 DEC 2023',
		author: 'Dr. Kevin Zhang',
	},
	{
		title: "Women's Health: Comprehensive Care Guidelines",
		image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop',
		date: '21 DEC 2023',
		author: 'Dr. Amanda Taylor',
	},
	{
		title: 'Medical Ethics in Modern Healthcare',
		image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop',
		date: '19 DEC 2023',
		author: 'Dr. Christopher Moore',
	},
];

export default async function Blogs() {
	return (
		<>
			<NewsLetter />
			<div className='bg-slate-50 p-4 pt-12 blogs-wrapper'>
				<div className='max-w-6xl mx-auto'>
					<div className='text-center max-w-xl mx-auto'>
						<h2 className='text-3xl font-bold text-slate-900 inline-block'>Latest Blogs</h2>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 max-lg:max-w-3xl max-md:max-w-md mx-auto'>
						{blogs.map((blog, index) => (
							<div
								key={index}
								className='bg-white cursor-pointer rounded-lg overflow-hidden group relative before:absolute before:inset-0 before:z-10 before:bg-black before:opacity-30'
							>
								<img
									src={blog.image}
									alt={blog.title}
									className='w-full h-96 object-cover group-hover:scale-110 transition-all duration-300'
								/>
								<div className='bg-gradient-to-t from-black/60 via-black/60 to-transparent p-6 absolute bottom-0 left-0 right-0 z-20'>
									<span className='text-sm block mb-2 text-slate-300 font-semibold'>
										{blog.date} | BY {blog.author}
									</span>
									<h3 className='text-xl font-semibold text-white'>{blog.title}</h3>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<StartJourneyCTA />
		</>
	);
}
