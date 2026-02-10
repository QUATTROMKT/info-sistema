"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { updatedAt: "desc" },
    });
}

export async function createProduct(formData: FormData) {
    const name = formData.get("name") as string;
    const plataform = formData.get("plataform") as string;
    const status = formData.get("status") as string;
    const driveLink = formData.get("driveLink") as string;
    const miroLink = formData.get("miroLink") as string;
    const notionLink = formData.get("notionLink") as string;

    await prisma.product.create({
        data: {
            name,
            plataform,
            status,
            driveLink,
            miroLink,
            notionLink,
        },
    });

    revalidatePath("/produtos");
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({
        where: { id },
    });
    revalidatePath("/produtos");
}

export async function updateProductStatus(id: string, status: string) {
    await prisma.product.update({
        where: { id },
        data: { status }
    });
    revalidatePath("/produtos");
}
