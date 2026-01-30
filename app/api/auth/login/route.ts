import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
 try {
 const { email, password, role } = await request.json();
 if (!email || !password || !role) {
 return NextResponse.json(
 { message: 'Email, password, and role are required' },
 { status: 400 }
 );
 }
 const { db } = await connectToDatabase();
 const usersCollection = db.collection('users');
 const user = await usersCollection.findOne({ email, role });
 if (!user) {
 return NextResponse.json(
 { message: 'Invalid email or password' },
 { status: 401 }
 );
 }
 const isPasswordValid = await bcrypt.compare(password, user.password);
 if (!isPasswordValid) {
 return NextResponse.json(
 { message: 'Invalid email or password' },
 { status: 401 }
 );
 }
 const token = jwt.sign(
 { userId: user._id, email: user.email, role: user.role },
 process.env.JWT_SECRET || 'secret',
 { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
 );
 return NextResponse.json(
 { token, userId: user._id, email: user.email, role: user.role, name: user.name, },
 { status: 200 }
 );
 } catch (error) {
 console.error('Login error:', error);
 return NextResponse.json(
 { message: 'Internal server error' },
 { status: 500 }
 );
 }
}