import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/business-coach/save-insight
 * Save business insights as notes
 */
export async function POST(request: NextRequest) {
  try {
    const { content, title, userId, category } = await request.json() as {
      content: string;
      title: string;
      userId: string;
      category?: string;
    };

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create business note in database
    const note = await prisma.businessNote.create({
      data: {
        title: title || 'Business Insight',
        content: content,
        userId: userId,
        category: category || 'general',
        createdAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        createdAt: note.createdAt
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to save business insight', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 