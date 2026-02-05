import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();


    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }


    return NextResponse.json({ 
      id: user.id, 
      role: user.role, 
      name: user.name 
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}