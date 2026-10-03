const http = require('http');

const makeReq = (path, payload) => new Promise((resolve, reject) => {
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(JSON.parse(data)));
  });
  req.on('error', reject);
  req.write(JSON.stringify(payload));
  req.end();
});

(async () => {
  console.time('Total Time');
  
  console.time('POST /api/profile');
  const profilePayload = {
    name: 'Test Student',
    skills: [
      { skillId: 1, proficiency: 'advanced', evidenceType: 'project' },
      { skillId: 2, proficiency: 'advanced', evidenceType: 'course' }
    ]
  };
  const profileRes = await makeReq('/api/profile', profilePayload);
  console.timeEnd('POST /api/profile');
  console.log('Profile Student ID:', profileRes?.data?.studentId);
  
  console.time('POST /api/analysis');
  const analysisPayload = {
    studentId: profileRes.data.studentId,
    roleName: 'Junior Data Analyst'
  };
  const analysisRes = await makeReq('/api/analysis', analysisPayload);
  console.timeEnd('POST /api/analysis');
  
  console.timeEnd('Total Time');
})();
