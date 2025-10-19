import { Resend } from 'resend';
import { debugPrint } from '../utils';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email: string, otp: string, name: string) => {
	try {
		const { data, error } = await resend.emails.send({
			from: 'MedMate <noreply@wautopilot.com>',
			to: [email],
			subject: 'Your OTP for MedMate Login',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
						<h1 style="margin: 0; font-size: 28px;">MedMate</h1>
						<p style="margin: 10px 0 0 0; opacity: 0.9;">Your Health, Our Priority</p>
					</div>
					
					<div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
						<h2 style="color: #333; margin-bottom: 20px;">Hello ${name}!</h2>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
							You have requested to login to your MedMate account. Please use the following OTP to complete your login:
						</p>
						
						<div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
							<h3 style="color: #667eea; margin: 0; font-size: 32px; letter-spacing: 5px; font-weight: bold;">${otp}</h3>
						</div>
						
						<p style="color: #666; font-size: 14px; margin-top: 20px;">
							This OTP is valid for 10 minutes. If you didn't request this login, please ignore this email.
						</p>
						
						<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
							<p style="color: #999; font-size: 12px; margin: 0;">
								Best regards,<br>
								The MedMate Team
							</p>
						</div>
					</div>
				</div>
			`,
		});

		if (error) {
			console.error('Resend error:', error);
			return { success: false, error: 'Failed to send email' };
		}

		debugPrint('OTP email sent successfully:', data);
		return { success: true };
	} catch (error) {
		console.error('Email sending error:', error);
		return { success: false, error: 'Failed to send email' };
	}
};

export const generateOTP = (): string => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendContactEmail = async (
	contactEmail: string,
	formData: {
		firstname: string;
		lastname: string;
		email: string;
		phone?: string;
		subject: string;
		message: string;
	}
) => {
	try {
		const { data, error } = await resend.emails.send({
			from: 'MedMate Contact Form <noreply@wautopilot.com>',
			to: [contactEmail],
			subject: `Contact Form: ${formData.subject}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
						<h1 style="margin: 0; font-size: 28px;">MedMate Contact Form</h1>
						<p style="margin: 10px 0 0 0; opacity: 0.9;">New Contact Form Submission</p>
					</div>
					
					<div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
						<h2 style="color: #333; margin-bottom: 20px;">Contact Form Details</h2>
						
						<div style="background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0;">
							<p style="color: #666; margin: 10px 0;"><strong>Name:</strong> ${formData.firstname} ${
				formData.lastname
			}</p>
						<p style="color: #666; margin: 10px 0;"><strong>Email:</strong> ${formData.email}</p>
						${
							formData.phone
								? `<p style=\"color: #666; margin: 10px 0;\"><strong>Phone:</strong> ${formData.phone}</p>`
								: ''
						}
							<p style="color: #666; margin: 10px 0;"><strong>Subject:</strong> ${formData.subject}</p>
							<p style="color: #666; margin: 10px 0;"><strong>Message:</strong></p>
							<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
								<p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${formData.message}</p>
							</div>
						</div>
						
						<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
							<p style="color: #999; font-size: 12px; margin: 0;">
								This message was sent from the MedMate contact form.<br>
								Submitted on: ${new Date().toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			`,
		});

		if (error) {
			console.error('Resend error:', error);
			return { success: false, error: 'Failed to send email' };
		}

		debugPrint('Contact email sent successfully:', data);
		return { success: true };
	} catch (error) {
		console.error('Contact email sending error:', error);
		return { success: false, error: 'Failed to send email' };
	}
};
