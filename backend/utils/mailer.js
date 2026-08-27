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

const sendApprovalEmail = async (toEmail, userName, accountNumber) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || process.env.SMTP_USER,
                pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"SudaCards Bank" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
            to: toEmail,
            subject: '🎉 تهانينا! تمت الموافقة على حسابك وتفعيله - SudaCards',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; text-align: right; direction: rtl; padding: 25px; background-color: #0f172a;">
                    <div style="background-color: #1e293b; padding: 35px; border-radius: 16px; max-width: 520px; margin: 0 auto; border-top: 5px solid #10b981; color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 44px; margin-bottom: 10px;">🎉</div>
                            <h2 style="color: #10b981; margin: 0 0 5px 0; font-size: 24px; font-weight: bold;">تم تفعيل حسابك بنجاح!</h2>
                            <p style="color: #94a3b8; font-size: 14px; margin: 0;">أهلاً بك في منصة سوداكاردز الرقمية</p>
                        </div>
                        
                        <p style="font-size: 15px; color: #e2e8f0; line-height: 1.7;">
                            عزيزي العميل <strong>${userName || ''}</strong>،<br>
                            يسرنا إبلاغك بأنه تمت مراجعة مستنداتك والموافقة على طلب تسجيلك وتفعيل حسابك للعمل رسمياً.
                        </p>
                        
                        <div style="margin: 25px 0; padding: 20px; background-color: #0f172a; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; text-align: center;">
                            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">رقم حسابك البنكي:</div>
                            <div style="font-size: 28px; font-weight: bold; color: #10b981; letter-spacing: 4px; font-family: monospace;">${accountNumber}</div>
                        </div>

                        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.7;">
                            يمكنك الآن الدخول إلى تطبيق <strong>SudaCards</strong> والتمتع بكافة الخدمات المالية والدفع التلامسي NFC والشحن والتحويلات الفورية.
                        </p>
                        
                        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;">
                        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
                            فريق خدمة العملاء والأمان — سوداكاردز SudaCards
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Approval Email sent to %s: %s', toEmail, info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending Approval Email:', error);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendApprovalEmail
};
