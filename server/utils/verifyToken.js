const jwt = require('jsonwebtoken');

// Middleware for token verification
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract the token

    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided' });
    }

    console.log('Secret Key:', process.env.JSON_WEB_TOKEN_SECRET_KEY);
    console.log('Token:', token);
    
    jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Token Verification Error:', err);
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        req.userId = decoded.id; // Assuming your token has user ID
        next();
    });
}

module.exports = verifyToken;
