const AuditLog = require('../models/AuditLog');

const SYSTEM_PERMISSIONS = {
  super_admin: { all: ['view', 'create', 'edit', 'delete', 'export'] },
  school_admin: { all: ['view', 'create', 'edit', 'delete', 'export'] },
  sub_admin: {},
  teacher: {
    attendance: ['view', 'create', 'edit'],
    grades: ['view', 'create', 'edit'],
    library: ['view', 'create'],
    announcements: ['view'],
    messages: ['view', 'create'],
    schedule: ['view'],
  },
  student: {
    grades: ['view'],
    attendance: ['view'],
    library: ['view'],
    announcements: ['view'],
    messages: ['view', 'create'],
    schedule: ['view'],
    invoices: ['view'],
  },
  parent: {
    grades: ['view'],
    attendance: ['view'],
    announcements: ['view'],
    messages: ['view', 'create'],
    invoices: ['view'],
  },
  accountant: {
    invoices: ['view', 'create', 'edit'],
    payments: ['view', 'create'],
    expenses: ['view', 'create', 'edit'],
  },
};

function can(module, action) {
  return async (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthenticated' });

    if (user.role === 'super_admin' || user.role === 'school_admin') return next();

    const sysPerms = SYSTEM_PERMISSIONS[user.role] || {};
    if (sysPerms.all && sysPerms.all.includes(action)) return next();
    if (sysPerms[module] && sysPerms[module].includes(action)) return next();

    if (user.customRole) {
      const perm = user.customRole.permissions?.find(p => p.module === module);
      if (perm && perm.actions.includes(action)) return next();
    }

    return res.status(403).render('errors/403', { title: 'Permission Denied' });
  };
}

async function auditLog(action, module) {
  return async (req, res, next) => {
    try {
      await AuditLog.create({
        school: req.user?.school,
        user: req.user?._id,
        action,
        module,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    } catch (e) { /* non-blocking */ }
    next();
  };
}

module.exports = { can, auditLog, SYSTEM_PERMISSIONS };
