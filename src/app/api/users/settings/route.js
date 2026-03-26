import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    const user = await User.findOne({ userId }).select('automationSettings profileData paidPackage packageExpiryDate planDuration');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      settings: {
        automationSettings: user.automationSettings,
        profileData: user.profileData,
        plan: {
          paidPackage: user.paidPackage,
          packageExpiryDate: user.packageExpiryDate,
          planDuration: user.planDuration
        }
      } 
    });
  } catch (error) {
    console.error('GET settings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, automationSettings, profileData } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    const updateData = {};
    if (automationSettings !== undefined) updateData.automationSettings = automationSettings;
    if (profileData !== undefined) updateData.profileData = profileData;

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('automationSettings profileData');

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings: updatedUser 
    });
  } catch (error) {
    console.error('PUT settings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
