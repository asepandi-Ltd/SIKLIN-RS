const http = require('http');

http.get('http://localhost:3000/dashboard', { headers: { 'Cookie': 'sb-mock-auth-token=true' } }, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body length:', data.length));
}).on('error', (e) => {
  console.error(e);
});
