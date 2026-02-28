//order.schema.ts
import { z } from 'zod';
import { OrderStatus } from '@prisma/client'; // 引入 Prisma 生成的 Enum

// 建立訂單只需要收件人資訊
export const createOrderSchema = z.object({
    recipient: z.string().min(1, '收件人姓名不能為空').max(100, '姓名過長'),
    phone: z.string().min(10, '電話格式不正確').max(20, '電話過長'),
    city: z.string().min(1, '城市不能為空').max(50, '城市過長'),
    address: z.string().min(5, '地址太短').max(500, '地址過長'),
    deliveryMethod: z.string().min(1, '請選擇送貨方式').max(100),
    paymentMethod: z.string().min(1, '請選擇付款方式').max(100),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]], {
        message: "無效的訂單狀態",
    }),
    trackingNumber: z.string().optional(),
});

// [新增] 查詢所有訂單 (Admin)
export const adminOrdersQuerySchema = z.object({
    status: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]])
        .optional()
        .catch(undefined), // 若不合法則 fallback 為 undefined (查全部)
});

