const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const verifyJWT = require('../middleware/authMiddleware');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key';
const ALLOWED_ROLES = ['CUSTOMER', 'KITCHEN', 'ADMIN'];

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });

const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email || null,
  phone: user.phone || null,
  role: user.role,
});

const buildLegacyResponse = (admin) => ({
  id: `legacy-admin-${admin.id}`,
  name: admin.username,
  email: null,
  phone: null,
  role: 'ADMIN',
});

const findUserByIdentifier = async (identifier) => {
  const normalized = String(identifier || '').trim();
  if (!normalized) return null;

  const candidates = [];
  candidates.push({ phone: normalized });
  candidates.push({ email: normalized.toLowerCase() });

  return prisma.user.findFirst({
    where: {
      OR: candidates,
    },
  });
};

const getBootstrapActor = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role = 'CUSTOMER',
  } = req.body;

  const normalizedRole = String(role || 'CUSTOMER').toUpperCase();
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase() || null;
  const normalizedPhone = String(phone || '').trim() || null;

  if (!normalizedName || !password) {
    return res.status(400).json({ error: 'name and password are required' });
  }

  if (!normalizedEmail && !normalizedPhone) {
    return res.status(400).json({ error: 'email or phone is required' });
  }

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters long' });
  }

  try {
    const existingStaffCount = await prisma.user.count({
      where: {
        role: {
          in: ['ADMIN', 'KITCHEN'],
        },
      },
    });

    if (normalizedRole !== 'CUSTOMER' && existingStaffCount > 0) {
      const actor = getBootstrapActor(req);
      if (!actor || actor.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Only an authenticated admin can create staff accounts once the system is bootstrapped.',
        });
      }
    }

    const duplicate = await prisma.user.findFirst({
      where: {
        OR: [
          normalizedEmail ? { email: normalizedEmail } : undefined,
          normalizedPhone ? { phone: normalizedPhone } : undefined,
        ].filter(Boolean),
      },
    });

    if (duplicate) {
      return res.status(409).json({ error: 'A user with that email or phone already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password_hash: hashedPassword,
        role: normalizedRole,
      },
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    return res.status(201).json({
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.phone || req.body.username;
  const password = req.body.password;
  const normalizedIdentifier = String(identifier || '').trim();

  if (!normalizedIdentifier || !password) {
    return res.status(400).json({ error: 'identifier and password are required' });
  }

  try {
    const user = await findUserByIdentifier(normalizedIdentifier);

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken({
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
      });

      return res.json({
        token,
        user: buildUserResponse(user),
      });
    }

    const legacyAdmin = await prisma.admin.findUnique({
      where: {
        username: normalizedIdentifier,
      },
    });

    if (!legacyAdmin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isLegacyMatch = await bcrypt.compare(password, legacyAdmin.password_hash);
    if (!isLegacyMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      id: `legacy-admin-${legacyAdmin.id}`,
      role: 'ADMIN',
      name: legacyAdmin.username,
      legacy: true,
    });

    return res.json({
      token,
      user: buildLegacyResponse(legacyAdmin),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', verifyJWT, async (req, res) => {
  try {
    if (req.user.legacy) {
      return res.json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: null,
          phone: null,
          role: 'ADMIN',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
