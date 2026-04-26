import type { MatchAnalysisResult } from "@/types/analysis";

// Generates structured text analysis without requiring an AI API.
// If OPENAI_API_KEY is set, enhances the summary with GPT-4o.

export async function generateTextSummary(
  analysis: MatchAnalysisResult
): Promise<string> {
  const base = buildBaseText(analysis);

  if (!process.env.OPENAI_API_KEY) return base;

  try {
    return await enhanceWithAI(base, analysis);
  } catch {
    return base;
  }
}

function buildBaseText(a: MatchAnalysisResult): string {
  const { homeTeam: h, awayTeam: aw } = a;

  const favoriteLabel =
    a.favorite === "home"
      ? h.name
      : a.favorite === "away"
      ? aw.name
      : "Empate";

  const confLabel =
    a.confidence === "high"
      ? "Alta"
      : a.confidence === "medium"
      ? "Média"
      : "Baixa";

  const drawLabel =
    a.drawTendency === "high"
      ? "Alta"
      : a.drawTendency === "medium"
      ? "Média"
      : "Baixa";

  const trend = buildTrendText(a);
  const alerts = a.alerts.length ? `⚠️ Alerta: ${a.alerts.join(" | ")}` : "";

  return `
📊 ANÁLISE DO JOGO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏟️  ${h.name} vs ${aw.name}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 FAVORITO: ${favoriteLabel}
📐 Confiança: ${confLabel}

📈 PROBABILIDADES ESTIMADAS
   ${h.name}: ${a.homeWinPct}%
   Empate:     ${a.drawPct}%
   ${aw.name}: ${a.awayWinPct}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 LEITURA DO JOGO
${trend}

🏟️ CONTEXTO DA TABELA
Dados de contexto competitivo não disponíveis nesta versão.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 TENDÊNCIA DE EMPATE: ${drawLabel}
${a.drawTendencyFactors.map((f) => `  • ${f}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FORÇA DOS TIMES (Score 0-100)
   ${h.name}: ${a.homeScore} pts
   ${aw.name}: ${a.awayScore} pts

   Breakdown ${h.name}:
   • Posição tabela:  ${a.homeScoreBreakdown.tablePosition}/20
   • Forma recente:   ${a.homeScoreBreakdown.recentForm}/20
   • Mando de campo:  ${a.homeScoreBreakdown.fieldAdvantage}/15
   • Ataque:          ${a.homeScoreBreakdown.attackStrength}/15
   • Defesa:          ${a.homeScoreBreakdown.defenseStrength}/15
   • Motivação:       ${a.homeScoreBreakdown.motivation}/10
   • Confronto dir.:  ${a.homeScoreBreakdown.h2h}/5

   Breakdown ${aw.name}:
   • Posição tabela:  ${a.awayScoreBreakdown.tablePosition}/20
   • Forma recente:   ${a.awayScoreBreakdown.recentForm}/20
   • Mando de campo:  ${a.awayScoreBreakdown.fieldAdvantage}/15
   • Ataque:          ${a.awayScoreBreakdown.attackStrength}/15
   • Defesa:          ${a.awayScoreBreakdown.defenseStrength}/15
   • Motivação:       ${a.awayScoreBreakdown.motivation}/10
   • Confronto dir.:  ${a.awayScoreBreakdown.h2h}/5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${alerts}
`.trim();
}

function buildTrendText(a: MatchAnalysisResult): string {
  const h = a.homeTeam;
  const aw = a.awayTeam;

  if (a.favorite === "home" && a.confidence === "high") {
    return `${h.name} entra como favorito claro. Melhor posição na tabela (${h.rank}º vs ${aw.rank}º), melhor forma recente (${h.form.slice(
      -5
    )}) e vantagem de jogar em casa constroem esse favoritismo. O visitante precisará de uma atuação acima da média para surpreender.`;
  }

  if (a.favorite === "away" && a.confidence === "high") {
    return `Apesar de jogar fora, ${aw.name} chega como favorito. Superioridade na tabela (${aw.rank}º vs ${h.rank}º) e melhor forma recente (${aw.form.slice(
      -5
    )}) justificam o prognóstico. O mandante precisará superar o fator casa para compensar a desvantagem técnica.`;
  }

  if (a.confidence === "low") {
    return `Jogo de alto equilíbrio. ${h.name} (${h.rank}º) e ${aw.name} (${aw.rank}º) estão próximos em força. Qualquer resultado é plausível — cenário de baixa previsibilidade.`;
  }

  return `${
    a.favorite === "home" ? h.name : aw.name
  } tem leve vantagem, mas o jogo pode ser decidido nos detalhes. Forma recente e motivação no campeonato são os fatores decisivos.`;
}

async function enhanceWithAI(
  baseText: string,
  a: MatchAnalysisResult
): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Você é um analista de futebol sênior. Baseado nos dados a seguir, escreva um parágrafo de leitura do jogo em português com linguagem profissional e objetiva. Máximo 5 linhas.

Dados:
${a.homeTeam.name} (${a.homeTeam.rank}º, ${a.homeTeam.points} pts, forma: ${a.homeTeam.form.slice(
    -5
  )}, média gols: ${a.homeTeam.avgGoalsFor.toFixed(1)})
${a.awayTeam.name} (${a.awayTeam.rank}º, ${a.awayTeam.points} pts, forma: ${a.awayTeam.form.slice(
    -5
  )}, média gols: ${a.awayTeam.avgGoalsFor.toFixed(1)})
Favorito: ${a.favorite} | Confiança: ${a.confidence}
Probabilidades: Casa ${a.homeWinPct}% | Empate ${a.drawPct}% | Fora ${a.awayWinPct}%`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.4,
  });

  const aiInsight = response.choices[0]?.message?.content ?? "";

  return baseText.replace(
    "📋 LEITURA DO JOGO",
    `📋 LEITURA DO JOGO (IA)\n${aiInsight}\n\n📐 DADOS BRUTOS`
  );
}

export function buildAlerts(
  a: Omit<MatchAnalysisResult, "textSummary" | "alerts">
): string[] {
  const alerts: string[] = [];

  if (a.confidence === "low") {
    alerts.push("Baixa confiança — múltiplos fatores de incerteza");
  }

  if (a.drawTendency === "high") {
    alerts.push("Alta tendência de empate detectada");
  }

  const minPct = Math.min(a.homeWinPct, a.awayWinPct);
  const maxPct = Math.max(a.homeWinPct, a.awayWinPct);

  if (maxPct - minPct < 10) {
    alerts.push("Probabilidades muito próximas — jogo imprevisível");
  }

  return alerts;
}