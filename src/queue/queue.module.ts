import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule { }
