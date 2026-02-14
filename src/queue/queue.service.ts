import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
    private boss: PgBoss;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const host = this.configService.get<string>('DB_HOST');
        const port = this.configService.get<number>('DB_PORT');
        const user = this.configService.get<string>('DB_USERNAME');
        const password = this.configService.get<string>('DB_PASSWORD');
        const database = this.configService.get<string>('DB_NAME');

        const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;

        this.boss = new PgBoss(connectionString);
        this.boss.on('error', (error) => console.error(error));

        await this.boss.start();
        console.log('PgBoss started');
    }

    async onModuleDestroy() {
        await this.boss.stop();
    }

    async send(queue: string, data: any) {
        await this.boss.createQueue(queue);
        return this.boss.send(queue, data);
    }

    async subscribe(queue: string, callback: (job: any) => Promise<void>) {
        await this.boss.createQueue(queue);
        await this.boss.work(queue, async (job) => {
            await callback(job);
        });
    }
}
