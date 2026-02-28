import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Class } from './class.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';

describe('ClassesService', () => {
    let service: ClassesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClassesService,
                {
                    provide: getRepositoryToken(Class),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(SubConstituency),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ClassesService>(ClassesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
