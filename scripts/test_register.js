(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'NodeTester', email: `nodetester+${Date.now()}@tadkaplay.local`, password: 'password123', confirmPassword: 'password123' })
    });
    const json = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Request failed', err);
  }
})();