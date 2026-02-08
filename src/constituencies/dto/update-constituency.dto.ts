import { PartialType } from '@nestjs/swagger';
import { CreateConstituencyDto } from './create-constituency.dto';

export class UpdateConstituencyDto extends PartialType(CreateConstituencyDto) { }
