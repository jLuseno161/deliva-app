const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

module.exports = function (io) {
  const router = express.Router();
  router.use(requireAuth);

  // Retailer: create a delivery request
  router.post('/', requireRole('retailer'), (req, res) => {
    const { customer_name, customer_phone, address, item_description } = req.body;
    if (!customer_name || !customer_phone || !address || !item_description) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const info = db
      .prepare(
        `INSERT INTO delivery_requests (retailer_id, customer_name, customer_phone, address, item_description)
         VALUES (?,?,?,?,?)`
      )
      .run(req.user.id, customer_name, customer_phone, address, item_description);
    const created = db.prepare('SELECT * FROM delivery_requests WHERE id = ?').get(info.lastInsertRowid);
    io.emit('request:new', created); // dispatcher dashboards listen for this
    res.status(201).json(created);
  });

  // List requests, scoped by role
  router.get('/', (req, res) => {
    let rows;
    if (req.user.role === 'retailer') {
      rows = db.prepare('SELECT * FROM delivery_requests WHERE retailer_id = ? ORDER BY id DESC').all(req.user.id);
    } else if (req.user.role === 'dispatcher') {
      rows = db.prepare('SELECT * FROM delivery_requests ORDER BY id DESC').all();
    } else {
      // rider: only their assigned deliveries
      rows = db
        .prepare(
          `SELECT dr.* FROM delivery_requests dr
           JOIN assignments a ON a.delivery_request_id = dr.id
           WHERE a.rider_id = ? ORDER BY dr.id DESC`
        )
        .all(req.user.id);
    }
    res.json(rows);
  });

  // Dispatcher: assign a rider
  router.post('/:id/assign', requireRole('dispatcher'), (req, res) => {
    const { rider_id } = req.body;
    const request = db.prepare('SELECT * FROM delivery_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (request.status !== 'Requested') {
      return res.status(409).json({ error: `Cannot assign a request in status ${request.status}` });
    }
    db.prepare(
      'INSERT INTO assignments (delivery_request_id, rider_id, assigned_by) VALUES (?,?,?)'
    ).run(request.id, rider_id, req.user.id);
    db.prepare("UPDATE delivery_requests SET status = 'Assigned' WHERE id = ?").run(request.id);
    db.prepare(
      "INSERT INTO status_updates (delivery_request_id, status, updated_by) VALUES (?, 'Assigned', ?)"
    ).run(request.id, req.user.id);
    const updated = db.prepare('SELECT * FROM delivery_requests WHERE id = ?').get(request.id);
    io.emit('request:updated', updated);
    res.json(updated);
  });

  // Rider: advance status (Assigned -> PickedUp -> Delivered)
  const nextStatus = { Assigned: 'PickedUp', PickedUp: 'Delivered' };
  router.post('/:id/status', requireRole('rider'), (req, res) => {
    const request = db.prepare('SELECT * FROM delivery_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });
    const assigned = db
      .prepare('SELECT 1 FROM assignments WHERE delivery_request_id = ? AND rider_id = ?')
      .get(request.id, req.user.id);
    if (!assigned) return res.status(403).json({ error: 'Not assigned to you' });

    const target = nextStatus[request.status];
    if (!target) return res.status(409).json({ error: `No valid transition from ${request.status}` });

    // Delivered requires a confirmation "scan" code
    if (target === 'Delivered') {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Confirmation code required to mark Delivered' });
      db.prepare(
        'INSERT INTO confirmations (delivery_request_id, code) VALUES (?,?)'
      ).run(request.id, code);
    }

    db.prepare('UPDATE delivery_requests SET status = ? WHERE id = ?').run(target, request.id);
    db.prepare(
      'INSERT INTO status_updates (delivery_request_id, status, updated_by, note) VALUES (?,?,?,?)'
    ).run(request.id, target, req.user.id, req.body.note || null);

    const updated = db.prepare('SELECT * FROM delivery_requests WHERE id = ?').get(request.id);
    io.emit('request:updated', updated);
    res.json(updated);
  });

  // Full audit trail for a single request (used by any role viewing detail)
  router.get('/:id/history', (req, res) => {
    const history = db
      .prepare('SELECT * FROM status_updates WHERE delivery_request_id = ? ORDER BY id ASC')
      .all(req.params.id);
    res.json(history);
  });

  return router;
};
