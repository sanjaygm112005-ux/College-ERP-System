const supabase = require('../config/supabaseClient');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
        return res.status(503).json({
          message: 'Database connection not configured. Please set up SUPABASE_URL and Keys in .env.'
        });
      }

      // Retrieve user via Supabase Auth admin API using JWT
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      // Fetch role and details from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(401).json({ message: 'User profile not found in public.profiles table' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: profile.role,
        name: profile.full_name,
        phone: profile.phone
      };

      next();
    } catch (err) {
      console.error('Auth Middleware Error:', err);
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { protect, requireRole };
