const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.protect, userController.getAllUsers);
router.delete('/:id', authMiddleware.protect, userController.deleteUser);

module.exports = router;