const http = require('http');

const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin'
});

const reqOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const req = http.request(reqOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const response = JSON.parse(body);
        if (response.success) {
            console.log('Login successful. Token:', response.token);
            fetchUsers(response.token);
        } else {
            console.log('Login failed:', response);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(loginData);
req.end();

function fetchUsers(token) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/users?page=1&limit=15',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    
    const req2 = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            const data = JSON.parse(body);
            console.log('Users API Response:', JSON.stringify(data, null, 2));
        });
    });
    req2.end();
}
