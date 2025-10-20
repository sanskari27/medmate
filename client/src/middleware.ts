export { default } from 'next-auth/middleware';

export const config = {
	matcher: [
		// Protected page routes
		'/dashboard/:path*',
		'/profile/:path*',
		// Protected API routes
		'/api/user/:path*',
		'/api/user/profile/:path*',
		'/api/user/details/:path*',
		'/api/user/avatar/:path*',
	],
};
