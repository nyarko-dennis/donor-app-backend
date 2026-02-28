import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassesPageOptionsDto } from './dto/classes-page-options.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Class created.' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all classes' })
  @ApiResponse({ status: 200, description: 'List all classes.' })
  findAll(@Query() pageOptionsDto: ClassesPageOptionsDto) {
    return this.classesService.findAll(pageOptionsDto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get one class.' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Update class.' })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Delete class.' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
