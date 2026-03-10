import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 清理过期的临时订单
 */
export async function cleanupExpiredOrders() {
  try {
    const result = await prisma.tempOrder.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired orders`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
