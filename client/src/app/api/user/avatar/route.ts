// /app/api/avatar/[userId]/route.ts
import { extractAuthenticatedUserInfo } from '@/lib/utils/authUtils';
import { notFoundError } from '@/lib/utils/errorUtils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
	const userInfo = await extractAuthenticatedUserInfo();
	try {
		if (!userInfo.profilePicture) {
			return NextResponse.json(notFoundError(), { status: 404 });
		}
		const res = await fetch(userInfo.profilePicture);
		const buffer = await res.arrayBuffer();

		return new NextResponse(Buffer.from(buffer), {
			headers: {
				'Content-Type': res.headers.get('content-type') || 'image/jpeg',
				'Cache-Control': 'public, max-age=86400', // 1 day
			},
		});
	} catch {
		return NextResponse.redirect('/default-avatar.png');
	}
}
