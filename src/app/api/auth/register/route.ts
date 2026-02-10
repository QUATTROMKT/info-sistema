import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        // Only allow registration if no users exist (first-time setup)
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return NextResponse.json({ error: "Registro desabilitado. Usuário admin já existe." }, { status: 403 });
        }

        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Email, senha e nome são obrigatórios." }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role: "ADMIN",
            },
        });

        const token = await createToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        const response = NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
}
