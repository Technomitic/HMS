import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
 try {
 const { firstName, lastName, email, phone, dob, gender, address, city, state, pincode, password } = await request.json();
 if (!firstName || !lastName || !email || !phone || !password) {
 return NextResponse.json( {
 message: 'Missing required fields'
 }, { status: 400 }
 );
 }
 const { db } = await connectToDatabase();
 const patientsCollection = db.collection('patients');
 const usersCollection = db.collection('users');
 const existingUser = await usersCollection.findOne({ email });
 if (existingUser) {
 return NextResponse.json( {
 message: 'Email already registered'
 }, { status: 400 }
 );
 }
 const hashedPassword = await bcrypt.hash(password, 10);
 const patientResult = await patientsCollection.insertOne({ firstName, lastName, email, phone, dob, gender, address, city, state, pincode, mrn: `MRN${Date.now()}`, registrationDate: new Date(), status: 'active', });
 await usersCollection.insertOne({ email, password: hashedPassword, name: `${firstName} ${lastName}`, role: 'patient', patientId: patientResult.insertedId, createdAt: new Date(), });
 return NextResponse.json( {
 message: 'Patient registered successfully', patientId: patientResult.insertedId,
 }, { status: 201 }
 );
 } catch (error) {
 console.error('Registration error:', error);
 return NextResponse.json( {
 message: 'Internal server error'
 }, { status: 500 }
 );
 }
}