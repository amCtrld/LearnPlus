/**
 * Authentication utilities for one-time access code system
 * Ensures study data integrity: one participant = one UID
 */

import { getAdminFirestore } from './firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique access codes for study distribution
 * Format: 12 character alphanumeric (exclude ambiguous chars: 0/O, 1/I/L)
 */
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Exclude 0, 1, I, L, O
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate multiple access codes at once
 */
export function generateAccessCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateAccessCode());
  }
  return codes;
}

/**
 * Verify and activate an access code with transaction to prevent race conditions
 * Server-side function called from API route
 * 
 * Process:
 * 1. Check if code exists in accessCodes collection
 * 2. Verify code has not been used (used: false)
 * 3. Generate UID for participant
 * 4. Mark code as used (used: true, usedAt: now) - ATOMICALLY
 * 5. Create initial session document for UID
 * 6. Return UID for client storage
 * 
 * Uses Firestore transaction to prevent race condition where
 * multiple users could use the same code simultaneously.
 */
export async function verifyAndActivateAccessCode(code: string): Promise<string> {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin not initialized');
  }

  try {
    // Query for the access code
    const codesRef = db.collection('accessCodes');
    const snapshot = await codesRef.where('code', '==', code).limit(1).get();

    if (snapshot.empty) {
      throw new Error('Invalid or already used access code');
    }

    const codeDoc = snapshot.docs[0];
    const codeDocRef = codesRef.doc(codeDoc.id);

    // Use transaction to atomically check and update the code
    const uid = await db.runTransaction(async (transaction: any) => {
      const codeSnapshot = await transaction.get(codeDocRef);
      
      if (!codeSnapshot.exists) {
        throw new Error('Invalid or already used access code');
      }

      const codeData = codeSnapshot.data();
      
      // Check if code is already used within the transaction
      if (codeData?.used === true) {
        throw new Error('Invalid or already used access code');
      }

      // Generate UID for this participant
      const newUid = `uid_${uuidv4().split('-')[0]}`; // Shorter UID format

      // Update access code document atomically
      transaction.update(codeDocRef, {
        uid: newUid,
        used: true,
        usedAt: new Date(),
      });

      // Create initial session document
      const sessionRef = db.collection('sessions').doc(newUid);
      transaction.set(sessionRef, {
        uid: newUid,
        mode: null, // Will be set when user selects mode
        startTime: new Date(),
        currentProblemId: 1,
        completedProblems: [],
      });

      return newUid;
    });

    return uid;
  } catch (error) {
    console.error('Error verifying access code:', error);
    throw error;
  }
}

/**
 * Store access codes in Firestore (admin function)
 * Called when admin generates batch of codes
 */
export async function storeAccessCodes(codes: string[]): Promise<void> {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin not initialized');
  }

  const batch = db.batch();
  const codesRef = db.collection('accessCodes');

  codes.forEach((code) => {
    const docRef = codesRef.doc();
    batch.set(docRef, {
      code,
      created: new Date(),
      used: false,
    });
  });

  await batch.commit();
}

/**
 * Check access code status (admin function)
 * Returns count of used and unused codes
 */
export async function getAccessCodeStatus(): Promise<{
  total: number;
  used: number;
  unused: number;
  codes: Array<{ code: string; used: boolean; usedAt?: Date; uid?: string }>;
}> {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin not initialized');
  }

  const snapshot = await db.collection('accessCodes').get();
  const codes = snapshot.docs.map((doc: any) => doc.data());

  const used = codes.filter((c: any) => c.used).length;
  const unused = codes.length - used;

  return {
    total: codes.length,
    used,
    unused,
    codes: codes as any,
  };
}
