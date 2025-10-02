import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { EmailService } from './mailer.service';
@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const host = config.get<string>('SMTP_HOST', 'localhost');
        const port = Number(config.get<string>('SMTP_PORT', '465'));
        const user = config.get<string>('SMTP_USER');
        const pass = config.get<string>('SMTP_PASS');
        const from = config.get<string>('SMTP_FROM', user);

        return {
          transport: {
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 20_000,
            tls:{
               rejectUnauthorized: false //allow self-signed certificates
            }
          },
          defaults: {
            from,
          },
          template: {
            dir: __dirname + '/templates',
            adapter: new EjsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}
