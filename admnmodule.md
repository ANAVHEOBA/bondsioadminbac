curl -X 'POST'   'http://localhost:3001/admin/login'   -H 'accept: application/json'   -H 'Content-Type: application/json'   -d '{
  "email": "admin@bondsio.com",
  "password": "Admin@123"
}'
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGJvbmRzaW8uY29tIiwic3ViIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NTg4NzYyMDMsImV4cCI6MTc1ODk2MjYwM30.a8cnsWSEJDpt1tb71X7osZdY3LLV5oVaJjsbnl2Bw-g","admin":{"id":1,"email":"admin@bondsio.com","role":"super_admin"}}





