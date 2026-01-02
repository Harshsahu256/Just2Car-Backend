import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password cannot be empty for hashing.');
    }
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePasswords = async (plainPassword, hashedPassword) => {
    if (!plainPassword || !hashedPassword) {
        return false;
    }
    return bcrypt.compare(plainPassword, hashedPassword);
};

export { hashPassword, comparePasswords };