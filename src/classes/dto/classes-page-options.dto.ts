import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class ClassesPageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Comma-separated sub-constituency IDs',
  })
  @Transform(({ value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return typeof value === 'string' ? value.split(',') : value;
  })
  @IsString({ each: true })
  @IsOptional()
  readonly subConstituencyId?: string | string[];
}
