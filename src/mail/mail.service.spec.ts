import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
    let service: MailService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MailService],
        }).compile();

        service = module.get<MailService>(MailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should attach the logo', () => {
        const attachments = service['defaultAttachments'];
        expect(attachments).toBeDefined();
        expect(attachments.length).toBe(1);
        expect(attachments[0].filename).toBe('gis_logo.png');
        expect(attachments[0].cid).toBe('gis_logo');
    });
});
