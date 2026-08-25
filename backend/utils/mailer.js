const nodemailer = require('nodemailer');

const sendOTPEmail = async (toEmail, otpCode) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"SudaCards Security" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'رمز التحقق الخاص بحسابك - SudaCards',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; border-top: 4px solid #00E676;">
                        <h2 style="color: #333;">مرحباً بك في سوداكاردز</h2>
                        <p style="font-size: 16px; color: #555;">شكراً لتسجيلك في النظام. رمز التحقق الخاص بك هو:</p>
                        <div style="margin: 30px 0; padding: 15px; background-color: #f0fdf4; border: 2px dashed #00E676; border-radius: 8px; text-align: center;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00E676;">${otpCode}</span>
                        </div>
                        <p style="font-size: 14px; color: #777;">هذا الرمز صالح لمدة 15 دقيقة فقط. يرجى عدم مشاركته مع أي شخص.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #aaa;">إذا لم تقم بالتسجيل، يرجى تجاهل هذه الرسالة.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending OTP Email:', error);
        return false;
    }
};

module.exports = {
    sendOTPEmail
};
