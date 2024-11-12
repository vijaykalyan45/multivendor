function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'The user is not authorized' });
    }
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token has expired' });
    }
  
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
  
  module.exports = errorHandler;
  