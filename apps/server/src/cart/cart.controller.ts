import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get the signed-in user's cart with subtotal" })
  getCart(@Req() req: any) {
    return this.cart.getCart(req.user.id);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'List products available to add to the cart' })
  catalog() {
    return this.cart.catalog();
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart (increments if already present)' })
  addItem(@Req() req: any, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(req.user.id, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Set the quantity of a cart line' })
  updateItem(@Req() req: any, @Param('productId') productId: string, @Body() dto: UpdateCartItemDto) {
    return this.cart.updateItem(req.user.id, productId, dto.quantity);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove a product from the cart' })
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    return this.cart.removeItem(req.user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Empty the cart' })
  clear(@Req() req: any) {
    return this.cart.clear(req.user.id);
  }
}
