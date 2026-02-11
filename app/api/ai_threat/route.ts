import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "fake_key");

export async function POST() {
  const logs = await prisma.patrolLog.findMany({
    take: 50,
    orderBy: { checkInTime: "desc" },
    include: { user: true, checkpoint: true },
  });

  try {
    const context = logs
      .map(
        (l) =>
          `[${new Date(l.checkInTime).toLocaleTimeString("en-US", {
            timeZone: "Asia/Kolkata",
            hour12: false,
          })}] ${l.user.name} @ ${l.checkpoint.name} (Status: ${l.status})`,
      )
      .join("\n");

    const todayStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
    });

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are the AI Security Core. Current Date: ${todayStr}.
      LOG DATA: ${context}

      TASK: Perform a full security audit based on the logs provided.

      OUTPUT FORMAT:
      Return ONLY a raw JSON object (no markdown).
      {
        "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "score": number (0-100, where 100 is safe),
        "shortAnalysis": "1-2 sentence summary.",
        "actionItems": ["Action 1", "Action 2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error) {
    console.log("⚠️ AI Offline/Error. Calculating Local Score.");

    let simulatedThreat = "LOW";
    let simulatedScore = 98;
    let analysis = "All systems operational. Patrol frequency is optimal.";
    let actions = ["Continue standard monitoring."];

    const totalLogs = logs.length;
    const hasSOS = logs.some((l) => l.status === "SOS");

    if (hasSOS) {
      simulatedThreat = "CRITICAL";
      simulatedScore = 15;
      analysis = "EMERGENCY SIGNAL DETECTED. Immediate response required.";
      actions = [
        "Contact On-Duty Supervisor.",
        "Alert Local Authorities.",
        "Check SOS Location.",
      ];
    } else if (totalLogs < 3) {
      simulatedThreat = "MEDIUM";
      simulatedScore = 65;
      analysis = "Patrol volume is significantly lower than average.";
      actions = ["Verify Guard Schedule.", "Check connectivity."];
    }

    return NextResponse.json({
      threatLevel: simulatedThreat,
      score: simulatedScore,
      shortAnalysis: analysis,
      actionItems: actions,
    });
  }
}
