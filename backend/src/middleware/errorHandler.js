const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database error',
            message: err.message,
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
};

module.exports = errorHandler; 