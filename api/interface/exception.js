const exceptionError = (err, res) => {
    console.error('Error :', err);
    console.log('======================')
    res.status(400).json({ message: 'Error ', error: err });
}

const exceptionDBQuery = (err, res) => {
    console.error('Database query failed :', err);
    console.log('======================');
    res.status(500).json({ message: 'Database query failed', error: err });
}

const exceptionEstablish = (err, res) => {
    console.error('Failed to establish a database connection :', err);
    console.log('======================');
    res.status(500).json({ message: 'Failed to establish a database connection' });
}

const exceptionCredentials = (res) => {
    console.log('Login failed: Invalid credentials');
    console.log('======================');
    res.status(401).json({ message: 'Invalid credentials' });
}



module.exports = { 
    exceptionError, 
    exceptionDBQuery, 
    exceptionEstablish, 
    exceptionCredentials
};