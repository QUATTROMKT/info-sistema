"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIntegrations() {
    return await prisma.integration.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getIntegration(platform: string) {
    return await prisma.integration.findFirst({
        where: { platform },
    });
}

export async function saveIntegration(formData: FormData) {
    const platform = formData.get("platform") as string;
    const apiKey = formData.get("apiKey") as string;
    const accountId = formData.get("accountId") as string;

    // Upsert: update if exists, create if not
    const existing = await prisma.integration.findFirst({
        where: { platform },
    });

    if (existing) {
        await prisma.integration.update({
            where: { id: existing.id },
            data: {
                apiKey,
                accountId,
                isActive: true,
            },
        });
    } else {
        await prisma.integration.create({
            data: {
                platform,
                apiKey,
                accountId,
                isActive: true,
            },
        });
    }

    revalidatePath("/configuracoes");
    revalidatePath("/campanhas");
}

export async function toggleIntegration(id: string, currentActive: boolean) {
    await prisma.integration.update({
        where: { id },
        data: { isActive: !currentActive },
    });
    revalidatePath("/configuracoes");
}

export async function deleteIntegration(id: string) {
    await prisma.integration.delete({
        where: { id },
    });
    revalidatePath("/configuracoes");
}
