import { PartialType } from '@nestjs/swagger';
import { CreateSubConstituencyDto } from './create-sub-constituency.dto';

export class UpdateSubConstituencyDto extends PartialType(CreateSubConstituencyDto) { }
