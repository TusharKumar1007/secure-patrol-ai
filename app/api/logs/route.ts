import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export async function GET() {
  try {
    const logs = await prisma.patrolLog.findMany({
      orderBy: { checkInTime: 'desc' }, 
      take: 20,
      include: {
        user: true,       
        checkpoint: true, 
      },
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, checkpointId } = body;


    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: checkpointId }
    });

    if (!checkpoint) return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });


    const newLog = await prisma.patrolLog.create({
      data: {
        userId: userId,
        checkpointId: checkpointId,

        gpsLatitude: checkpoint.latitude || 12.9716, 
        gpsLongitude: checkpoint.longitude || 77.5946
      },
    });

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}