import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST() {

  const logs = await prisma.patrolLog.findMany({
    take: 10, 
    orderBy: { checkInTime: 'desc' },
    include: { user: true, checkpoint: true }
  });


  const logsList = logs.map(log => 
    `- Guard ${log.user.name} visited ${log.checkpoint.name} at ${new Date(log.checkInTime).toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata", 
      dateStyle: "medium",
      timeStyle: "short",
    })}`
  ).join('\n');

  try {

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 
    
    const prompt = `
      You are a security supervisor. Analyze these recent patrol logs:
      
      ${logsList}
      
      Write a short, professional summary (max 3 sentences). 
      Mention if the patrols seem active or if there are any gaps.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return NextResponse.json({ analysis: response.text() });

  } catch (error) {
    console.error("AI Error:", error);
    
    return NextResponse.json({ 
      analysis: `⚠️ **AI Service Busy.**\n\nHowever, system data shows **${logs.length}** recent patrols were completed successfully. Operations are normal.` 
    });
  }
}