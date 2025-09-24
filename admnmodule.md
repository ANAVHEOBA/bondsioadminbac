curl -X 'POST'   'http://localhost:3001/admin/login'   -H 'accept: application/json'   -H 'Content-Type: application/json'   -d '{
  "email": "admin@bondsio.com",
  "password": "Admin@123"
}'
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGJvbmRzaW8uY29tIiwic3ViIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NTg2OTQ5MTQsImV4cCI6MTc1ODc4MTMxNH0.Q2RHWzFxk86X-Cqp8LusWkG3bhSPqY3afk5mQSg1dZQ","admin":{"id":1,"email":"admin@bondsio.com","role":"super_admin"}}





