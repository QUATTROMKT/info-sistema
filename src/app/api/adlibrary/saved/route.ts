import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: list saved ads
export async function GET() {
    try {
        const savedAds = await prisma.savedAd.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ ads: savedAds });
    } catch (error) {
        console.error("Saved ads fetch error:", error);
        return NextResponse.json({ error: "Erro ao buscar salvos." }, { status: 500 });
    }
}

// POST: save an ad
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adId, pageName, pageId, adText, imageUrl, videoUrl, platform, country, startDate, landingPageUrl, category } = body;

        if (!adId || !pageName) {
            return NextResponse.json({ error: "adId e pageName são obrigatórios." }, { status: 400 });
        }

        // Check if already saved
        const existing = await prisma.savedAd.findUnique({ where: { adId } });
        if (existing) {
            return NextResponse.json({ error: "Anúncio já salvo.", alreadySaved: true }, { status: 200 });
        }

        const saved = await prisma.savedAd.create({
            data: { adId, pageName, pageId, adText, imageUrl, videoUrl, platform, country, startDate, landingPageUrl, category },
        });

        return NextResponse.json({ success: true, ad: saved });
    } catch (error) {
        console.error("Save ad error:", error);
        return NextResponse.json({ error: "Erro ao salvar anúncio." }, { status: 500 });
    }
}

// DELETE: remove a saved ad
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adId = searchParams.get("adId");

        if (!adId) {
            return NextResponse.json({ error: "adId é obrigatório." }, { status: 400 });
        }

        await prisma.savedAd.delete({ where: { adId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete ad error:", error);
        return NextResponse.json({ error: "Erro ao remover anúncio." }, { status: 500 });
    }
}
