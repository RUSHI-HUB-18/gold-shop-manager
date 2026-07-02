import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-gold-key';

export function signToken(payload: { id: string; role: string; username: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string; username: string };
  } catch (error) {
    return null;
  }
}
