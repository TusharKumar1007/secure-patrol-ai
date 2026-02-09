import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;

    const whereCondition = {
      user: {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
    };

    const logs = await prisma.patrolLog.findMany({
      where: whereCondition,
      orderBy: { checkInTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: true,
        checkpoint: true,
      },
    });

    const totalLogs = await prisma.patrolLog.count({
      where: whereCondition,
    });

    return NextResponse.json({
      logs,
      totalPages: Math.ceil(totalLogs / pageSize),
      currentPage: page,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, checkpointId, status } = body;

    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint)
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 },
      );

    const newLog = await prisma.patrolLog.create({
      data: {
        userId: userId,
        checkpointId: checkpointId,

        gpsLatitude: checkpoint.latitude || 12.9716,
        gpsLongitude: checkpoint.longitude || 77.5946,
        status: status || "VERIFIED",
      },
    });

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 },
    );
  }
}
