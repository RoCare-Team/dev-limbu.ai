import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import AutomationPlan from '@/models/AutomationPlan';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { businessProfileDescription, userId: bodyUserId } = body;

    if (typeof businessProfileDescription !== 'string') {
      return NextResponse.json({ error: 'businessProfileDescription (string) required' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const finalUserId = bodyUserId || user.userId || user._id.toString();

    const plan = await AutomationPlan.findOne({
      $or: [{ userId: finalUserId }, { userId: user.userId }, { userRef: user._id }],
    }).sort({ createdAt: -1 });

    if (!plan) {
      return NextResponse.json(
        {
          error:
            'No automation plan found. Open Settings, configure automation, and save once — then you can save your description here.',
        },
        { status: 400 }
      );
    }

    const text = businessProfileDescription.slice(0, 20000);
    await AutomationPlan.updateOne({ _id: plan._id }, { $set: { businessProfileDescription: text } });

    return NextResponse.json({ success: true, businessProfileDescription: text });
  } catch (e) {
    console.error('[business-description]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
