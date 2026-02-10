"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFinancialRecords() {
    return await prisma.financialRecord.findMany({
        orderBy: { dueDate: "asc" },
    });
}

export async function createFinancialRecord(formData: FormData) {
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const type = formData.get("type") as string;
    const category = formData.get("category") as string;
    const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
    const status = formData.get("status") as string;

    await prisma.financialRecord.create({
        data: {
            description,
            amount,
            type,
            category,
            dueDate,
            status,
        },
    });

    revalidatePath("/financeiro");
}

export async function deleteFinancialRecord(id: string) {
    await prisma.financialRecord.delete({
        where: { id },
    });
    revalidatePath("/financeiro");
}

export async function toggleFinancialStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    await prisma.financialRecord.update({
        where: { id },
        data: { status: newStatus }
    });
    revalidatePath("/financeiro");
}
