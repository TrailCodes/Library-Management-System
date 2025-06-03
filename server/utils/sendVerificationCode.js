import {generateVerificationOtpEmailTemplate} from "./emailTemplates.js"
import {sendEmail} from "./sendEmail.js";

export async function sendVerificationCode(verificationCode , email ,res) {
    try {
        const message = generateVerificationOtpEmailTemplate(verificationCode);
        sendEmail ({
            email,
            subject : "Verification Code For Library",
            message,
        });
        res.status(200).json({
            success : true,
            message : "Verification Code Send Successfully",
        });

    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : "verification Code Failed to Send",
        })
    }
}