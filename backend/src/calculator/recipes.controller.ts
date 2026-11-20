import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { RecipesService } from './recipes.service';

type Body_ = Record<string, unknown>;

@Controller('calculator/recipes')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get(':productCode')
  get(@Param('productCode') code: string) {
    return this.service.getRecipe(code);
  }

  @Post('preview')
  preview(@Body() b: Body_) {
    return this.service.preview(b);
  }

  @Post('product')
  createProduct(@Body() b: Body_) {
    return this.service.createProduct(b);
  }

  @Patch('product/:id')
  updateProduct(@Param('id', new ParseUUIDPipe()) id: string, @Body() b: Body_) {
    return this.service.updateProduct(id, b);
  }

  @Post('component')
  createComponent(@Body() b: Body_) {
    return this.service.createComponent(b);
  }

  @Patch('component/:id')
  updateComponent(@Param('id', new ParseUUIDPipe()) id: string, @Body() b: Body_) {
    return this.service.updateComponent(id, b);
  }

  @Delete('component/:id')
  deleteComponent(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.deleteComponent(id);
  }

  @Post('rule')
  createRule(@Body() b: Body_) {
    return this.service.createRule(b);
  }

  @Patch('rule/:id')
  updateRule(@Param('id', new ParseUUIDPipe()) id: string, @Body() b: Body_) {
    return this.service.updateRule(id, b);
  }

  @Delete('rule/:id')
  deleteRule(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.deleteRule(id);
  }
}