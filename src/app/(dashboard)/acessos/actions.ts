"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCredentials() {
    return await prisma.credential.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function createCredential(formData: FormData) {
    const service = formData.get("service") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const url = formData.get("url") as string;
    const category = formData.get("category") as string;

    await prisma.credential.create({
        data: {
            service,
            username,
            password,
            url,
            category,
        },
    });

    revalidatePath("/acessos");
}

export async function deleteCredential(id: string) {
    await prisma.credential.delete({
        where: { id },
    });
    revalidatePath("/acessos");
}
