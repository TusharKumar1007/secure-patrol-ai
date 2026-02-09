import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    const logs = await prisma.patrolLog.findMany({
      take: 20,
      orderBy: { checkInTime: "desc" },
      include: { user: true, checkpoint: true },
    });

    const context = logs
      .map(
        (l) =>
          `[${new Date(l.checkInTime).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}] ${l.user.name} @ ${l.checkpoint.name} , status ${l.status}`,
      )
      .join("\n");

    const todayStr = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
    });

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are Commander Aegis. 
      CURRENT DATE: ${todayStr}
      
      Here is the raw log data:
      ${context}

      OPERATIONAL RULES:
      1. Check-ins at :15 past the hour are LATE.
      2. Duplicate checks < 5 mins are SUSPICIOUS.

      RESPONSE GUIDELINES:
      1. If the user asks about "Today", ONLY analyze logs marked with "${todayStr}". IGNORE older logs.
      2. If there are NO logs for ${todayStr}, say "Status: QUIET. No activity recorded today."
      3. Start with "Status: OPTIMAL" or "Status: ATTENTION REQUIRED".
      4. Group issues together. Do not list every timestamp.
      5. Do NOT use Markdown symbols (** or ##).

      The Supervisor asks: "${question}"
    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ answer: result.response.text() });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({
      answer:
        "⚠️ Secure Link Interrupted. I cannot process complex queries right now, but the live dashboard data above is accurate.",
    });
  }
}
