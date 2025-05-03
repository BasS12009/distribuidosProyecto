const bcrypt = require('bcrypt');

const hashPassword = async (password) => await bcrypt.hash(password, 10);
const comparePassword = async (raw, hashed) => await bcrypt.compare(raw, hashed);

module.exports = { hashPassword, comparePassword };
