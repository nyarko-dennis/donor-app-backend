import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstituenciesService } from './constituencies.service';
import { ConstituenciesController } from './constituencies.controller';
import { Constituency } from './constituency.entity';
import { SubConstituency } from './sub-constituency.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Constituency, SubConstituency])],
    controllers: [ConstituenciesController],
    providers: [ConstituenciesService],
    exports: [ConstituenciesService]
})
export class ConstituenciesModule { }
