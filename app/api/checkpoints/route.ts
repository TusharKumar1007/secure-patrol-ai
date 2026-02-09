import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {

    const checkpoints = await prisma.checkpoint.findMany();
    return NextResponse.json(checkpoints);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, instruction, videoUrl } = body;

    const updated = await prisma.checkpoint.update({
      where: { id },
      data: {
        instruction,
        videoUrl
      }
    });

    return NextResponse.json({ success: true, checkpoint: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}