const fetch = require('node-fetch');
const querystring = require('querystring');

exports.handler = async (event, context) => {
    const code = event.queryStringParameters.code;
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing code parameter' }),
        };
    }

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: querystring.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            return {
                statusCode: 200,
                body: JSON.stringify({ access_token: data.access_token }),
            };
        } else {
            console.error('GitHub token exchange failed:', data);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token exchange failed', details: data }),
            };
        }
    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};