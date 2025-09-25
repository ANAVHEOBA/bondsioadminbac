curl -X 'POST'   'http://localhost:3001/admin/login'   -H 'accept: application/json'   -H 'Content-Type: application/json'   -d '{
  "email": "admin@bondsio.com",
  "password": "Admin@123"
}'
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGJvbmRzaW8uY29tIiwic3ViIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NTg3ODQxOTMsImV4cCI6MTc1ODg3MDU5M30.pJ-Jt3ahrb6ZHqtUDzxEFIhIu1vlCgpickPx4zbie20","admin":{"id":1,"email":"admin@bondsio.com","role":"super_admin"}}





