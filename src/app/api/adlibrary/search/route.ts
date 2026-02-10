import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const integration = await prisma.integration.findFirst({
            where: { platform: "FACEBOOK", isActive: true },
        });

        if (!integration || !integration.apiKey) {
            return NextResponse.json({ error: "Meta Ads não configurado. Vá em Configurações.", connected: false }, { status: 200 });
        }

        const { searchParams } = new URL(request.url);
        const searchTerms = searchParams.get("q") || "";
        const country = searchParams.get("country") || "BR,US"; // Default: both
        const mediaType = searchParams.get("media_type") || "";
        const activeStatus = searchParams.get("active_status") || "ACTIVE";
        const platform = searchParams.get("platform") || "";
        const language = searchParams.get("language") || "";
        const after = searchParams.get("after") || "";
        const limit = searchParams.get("limit") || "100"; // Higher limit for better filtering
        const minDaysActive = parseInt(searchParams.get("min_days_active") || "0");
        const minAdsCount = parseInt(searchParams.get("min_ads_count") || "0");

        if (!searchTerms) {
            return NextResponse.json({ error: "Informe um termo de busca.", connected: true }, { status: 200 });
        }

        const accessToken = integration.apiKey;

        // Build country array for the API
        const countries = country.split(",").map(c => c.trim()).filter(Boolean);
        const countriesParam = JSON.stringify(countries); // e.g. ["BR","US"]

        const fields = [
            "id", "ad_creative_bodies", "ad_creative_link_captions",
            "ad_creative_link_titles", "ad_creative_link_descriptions",
            "ad_delivery_start_time", "ad_delivery_stop_time",
            "bylines", "publisher_platforms", "page_id", "page_name",
            "ad_snapshot_url", "languages"
        ].join(",");

        const params = new URLSearchParams({
            access_token: accessToken,
            search_terms: searchTerms,
            ad_reached_countries: countriesParam,
            ad_active_status: activeStatus,
            ad_type: "ALL",
            limit,
            fields,
        });

        if (mediaType) params.set("media_type", mediaType);
        if (platform) params.set("publisher_platforms", `["${platform}"]`);
        if (language) params.set("languages", `["${language}"]`);
        if (after) params.set("after", after);

        const apiUrl = `https://graph.facebook.com/v21.0/ads_archive?${params.toString()}`;
        console.log("[Ad Library] Fetching:", apiUrl.replace(accessToken, "TOKEN_HIDDEN"));

        const response = await fetch(apiUrl, { cache: "no-store" });
        const data = await response.json();

        // Handle API errors
        if (data.error) {
            console.error("[Ad Library] API Error:", JSON.stringify(data.error));
            const errorMsg = data.error.message || "Erro desconhecido da API da Meta.";
            const errorCode = data.error.code;

            if (errorCode === 190) {
                return NextResponse.json({
                    error: "Token de acesso expirado ou inválido. Atualize em Configurações.",
                    connected: true, errorCode,
                }, { status: 200 });
            }
            if (errorCode === 100) {
                return NextResponse.json({
                    error: "Permissão insuficiente. A conta Meta precisa ter identidade verificada para usar a Ad Library API.",
                    connected: true, errorCode,
                }, { status: 200 });
            }
            if (errorMsg.includes("ads_archive")) {
                return NextResponse.json({
                    error: "Sem acesso à Ad Library API. Verifique se sua conta Meta tem identidade verificada em developers.facebook.com.",
                    connected: true, errorCode,
                }, { status: 200 });
            }

            return NextResponse.json({ error: errorMsg, connected: true, errorCode }, { status: 200 });
        }

        const ads = data.data || [];

        // Aggregate page ad counts across the entire response
        const pageAdCounts: Record<string, number> = {};
        for (const ad of ads) {
            const pid = ad.page_id || ad.page_name || "unknown";
            pageAdCounts[pid] = (pageAdCounts[pid] || 0) + 1;
        }

        // Transform & filter ads
        const now = new Date();
        const transformedAds = ads
            .map((ad: any) => {
                const startDate = ad.ad_delivery_start_time;
                let daysActive = 0;
                if (startDate) {
                    const start = new Date(startDate);
                    daysActive = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                }

                return {
                    id: ad.id,
                    pageId: ad.page_id || null,
                    pageName: ad.page_name || (ad.bylines ? ad.bylines[0] : "Desconhecido"),
                    adText: ad.ad_creative_bodies?.[0] || "",
                    linkTitle: ad.ad_creative_link_titles?.[0] || "",
                    linkCaption: ad.ad_creative_link_captions?.[0] || "",
                    linkDescription: ad.ad_creative_link_descriptions?.[0] || "",
                    startDate: startDate || null,
                    stopDate: ad.ad_delivery_stop_time || null,
                    daysActive,
                    platforms: ad.publisher_platforms || [],
                    snapshotUrl: ad.ad_snapshot_url || null,
                    languages: ad.languages || [],
                    pageAdCount: pageAdCounts[ad.page_id || ad.page_name || "unknown"] || 1,
                };
            })
            .filter((ad: any) => {
                // Apply minimum days active filter
                if (minDaysActive > 0 && ad.daysActive < minDaysActive) return false;
                // Apply minimum ads per page filter
                if (minAdsCount > 0 && ad.pageAdCount < minAdsCount) return false;
                return true;
            });

        return NextResponse.json({
            connected: true,
            ads: transformedAds,
            total: transformedAds.length,
            totalBeforeFilter: ads.length,
            paging: data.paging || null,
        });
    } catch (error: any) {
        console.error("[Ad Library] Catch error:", error?.message || error);
        return NextResponse.json({
            error: `Erro: ${error?.message || "Falha na conexão com a API da Meta."}`,
            connected: true,
        }, { status: 200 });
    }
}
