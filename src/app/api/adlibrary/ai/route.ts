import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        // Check for OpenAI API key in integrations or env
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!openaiKey) {
            return NextResponse.json({
                error: "Chave da OpenAI não configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente.",
            }, { status: 400 });
        }

        const body = await request.json();
        const { action, adText, adId } = body;

        if (!adText) {
            return NextResponse.json({ error: "Texto do anúncio é obrigatório." }, { status: 400 });
        }

        let prompt = "";

        if (action === "generate_copy") {
            prompt = `Você é um copywriter expert em Facebook Ads e marketing digital. Baseado no anúncio abaixo, gere 3 variações criativas de ad copy em PT-BR.

Cada variação deve:
- Manter a mesma intenção e oferta
- Usar ganchos diferentes (curiosidade, prova social, urgência, medo de perder)
- Ter CTAs fortes e diretos
- Ser formatada para Facebook Ads (texto curto e impactante)

ANÚNCIO ORIGINAL:
"""
${adText}
"""

Responda em formato:

**Variação 1 — [Tipo de gancho]**
[copy]

**Variação 2 — [Tipo de gancho]**
[copy]

**Variação 3 — [Tipo de gancho]**
[copy]`;
        } else if (action === "analyze") {
            prompt = `Você é um analista expert em Facebook Ads e copywriting. Analise o anúncio abaixo e forneça insights acionáveis.

ANÚNCIO:
"""
${adText}
"""

Sua análise deve cobrir:

1. **Tipo de Gancho**: Qual técnica de atenção está sendo usada? (curiosidade, medo, prova social, autoridade, escassez, novidade)

2. **Estrutura do Copy**: Como o texto está organizado? (AIDA, PAS, storytelling, direto ao ponto)

3. **CTA (Call-to-Action)**: Qual é o CTA? É forte? Sugestões de melhoria.

4. **Público-alvo**: Para quem este ad parece ser direcionado?

5. **Pontos Fortes**: O que está funcionando bem neste ad?

6. **Pontos Fracos**: O que poderia ser melhorado?

7. **Score Geral**: Nota de 1-10 com justificativa.

Seja direto e prático. Foque em insights que ajudem a criar ads melhores.`;
        } else {
            return NextResponse.json({ error: "Ação inválida. Use 'generate_copy' ou 'analyze'." }, { status: 400 });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("OpenAI error:", errData);
            return NextResponse.json({ error: "Erro na API da OpenAI: " + (errData.error?.message || "desconhecido") }, { status: 500 });
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content || "Sem resposta.";

        // If analyzing and adId provided, save analysis to the saved ad
        if (action === "analyze" && adId) {
            try {
                await prisma.savedAd.update({
                    where: { adId },
                    data: { aiAnalysis: result },
                });
            } catch {
                // Ad might not be saved, that's ok
            }
        }

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("AI route error:", error);
        return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
}
