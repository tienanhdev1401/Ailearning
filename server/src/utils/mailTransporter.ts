import * as brevo from "@getbrevo/brevo";

// Brevo API Configuration (không bị chặn bởi firewall như SMTP)
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

interface SendMailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const transporter = {
  sendMail: async (options: SendMailOptions) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: "AlearnG",
      email: process.env.EMAIL_FROM || "tptienanh@gmail.com",
    };
    sendSmtpEmail.to = [{ email: options.to }];
    sendSmtpEmail.subject = options.subject;
    
    if (options.html) {
      sendSmtpEmail.htmlContent = options.html;
    } else if (options.text) {
      sendSmtpEmail.textContent = options.text;
    }

    return await apiInstance.sendTransacEmail(sendSmtpEmail);
  },
};

export default transporter;
