import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Xóa theo thứ tự tránh lỗi ràng buộc khóa ngoại
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.productType.deleteMany();
  await prisma.sizeOption.deleteMany();

}

main()
  .catch((e) => {
    console.error('Reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
