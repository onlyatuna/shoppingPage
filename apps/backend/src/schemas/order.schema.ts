//order.schema.ts
import { z } from 'zod';
import { OrderStatus } from '@prisma/client'; // 引入 Prisma 生成的 Enum

// 建立訂單只需要收件人資訊
export const createOrderSchema = z.object({
    recipient: z.string().min(1, '收件人姓名不能為空'),
    phone: z.string().min(10, '電話格式不正確'),
    city: z.string().min(1, '城市不能為空'),
    address: z.string().min(5, '地址太短'),
    deliveryMethod: z.string().min(1, '請選擇送貨方式'),
    paymentMethod: z.string().min(1, '請選擇付款方式'),
});

// [新增] 更新訂單狀態 Schema
export const updateOrderStatusSchema = z.object({
    status: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]], {
        message: "無效的訂單狀態",
    }),
});

