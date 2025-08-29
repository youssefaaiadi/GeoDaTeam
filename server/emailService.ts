import { MailService } from '@sendgrid/mail';

// Interface pour les paramètres d'email
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private mailService: MailService;
  private isConfigured: boolean = false;

  constructor() {
    this.mailService = new MailService();
    this.configure();
  }

  private configure() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      this.mailService.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('✓ SendGrid configured successfully');
    } else {
      console.log('⚠ SendGrid API key not found. Email notifications will be logged only.');
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.isConfigured) {
      // Si SendGrid n'est pas configuré, on simule l'envoi
      console.log(`📧 [SIMULATION] Email envoyé à ${params.to}`);
      console.log(`   Sujet: ${params.subject}`);
      console.log(`   Message: ${params.text || params.html}`);
      return true;
    }

    try {
      await this.mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      console.log(`✓ Email envoyé avec succès à ${params.to}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi d\'email:', error);
      return false;
    }
  }

  async sendAttendanceReminder(userEmail: string, userName: string): Promise<boolean> {
    const subject = 'Rappel de pointage - Geo DaTeam';
    const text = `
Bonjour ${userName},

Nous avons remarqué que vous n'avez pas encore pointé votre présence aujourd'hui.

N'oubliez pas de pointer votre arrivée sur l'application Geo DaTeam pour que votre présence soit enregistrée.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Geo DaTeam
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Geo DaTeam</h1>
        </div>
        <div class="content">
            <h2>Rappel de pointage</h2>
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Nous avons remarqué que vous n'avez pas encore pointé votre présence aujourd'hui.</p>
            <p>N'oubliez pas de pointer votre arrivée sur l'application Geo DaTeam pour que votre présence soit enregistrée.</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p>Cordialement,<br>L'équipe Geo DaTeam</p>
        </div>
    </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: userEmail,
      from: process.env.FROM_EMAIL || 'noreply@geodateam.com',
      subject,
      text,
      html
    });
  }
}

export const emailService = new EmailService();