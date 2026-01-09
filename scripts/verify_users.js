const http = require('http');

// Config
const PORT = 7001;
const HOST = '127.0.0.1';

// Helpers
function request(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function run() {
    console.log('--- Starting Verification ---');

    // 1. Login
    console.log('1. Logging in as admin...');
    try {
        const loginRes = await request('POST', '/api/v1/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (loginRes.statusCode !== 200 || !loginRes.body.success) {
            console.error('Login failed:', loginRes.body);
            process.exit(1);
        }

        const token = loginRes.body.data.token;
        console.log('Login successful. Token acquired.');

        // 2. Create User
        console.log('2. Creating new user...');
        const now = Date.now();
        const newUser = {
            username: `testuser_${now}`,
            email: `test_${now}@example.com`,
            password: 'password123',
            role: 'user',
            status: 'active'
        };

        const createRes = await request('POST', '/api/v1/users', newUser, token);
        if (!createRes.body.success) {
            console.error('Create User failed:', createRes.body);
        } else {
            console.log('Create User successful:', createRes.body.data.id);
        }

        // 3. List Users
        console.log('3. Listing users...');
        const listRes = await request('GET', '/api/v1/users', null, token);
        if (listRes.body.success) {
            console.log(`List successful. Found ${listRes.body.data.total} users.`);
        } else {
            console.error('List Users failed:', listRes.body);
        }

    } catch (err) {
        console.error('Verification failed with error:', err.message);
    }
}

run();
