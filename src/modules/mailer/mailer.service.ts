import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    constructor(private mailerService: MailerService) {}

    async sendEmail(email: string, template, context, subject: string) {
        const info = await this.mailerService.sendMail({
          to: email,
          subject,
          template,
          context: {
            ...context,
          },
          attachments: [
            {
              filename: 'tarket-bab.logo.png',
              path: __dirname + '/templates/partials/tarket-bab.logo.png',
              cid: 'elearn-logo',
            },
          ],
        });
        console.log('Message sent: %s', info.messageId);
    }

}
