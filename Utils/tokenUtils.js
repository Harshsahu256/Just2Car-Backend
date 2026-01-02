    import { generateToken } from "./jwt.js";

    const getTokenForUser = (user) => {
        if (!user || !user._id || !user.role) {
            console.error("Error: Invalid user object provided for token generation.", user);
            throw new Error('User ID and role are required to generate a token.');
        }
        return generateToken({ id: user._id, role: user.role });
    };

    export { getTokenForUser };