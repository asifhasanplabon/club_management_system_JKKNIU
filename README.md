#  Club Management System - JKKNIU

An online web application for managing university clubs efficiently.  
Built with **React, Node.js, Express.js, Tailwind CSS, and MySQL**.

This system allows university authorities, club authorities, and general members to manage and participate in university club activities digitally.

---

##  Features

###  Role-Based Authentication
The system supports three types of users:

1. **University Authority**
   - Approve or reject club creation
   - Monitor all clubs
   - Manage club authorities

2. **Club Authority**
   - Create and manage club events
   - Manage members
   - Perform CRUD operations on club data

3. **General Club Member**
   - Join clubs
   - View events
   - Participate in activities

---


## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios
- React Router DOM


### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt (Password Hashing)

---


##  Project Structure

club_management_system_JKKNIU/

│

├── frontend/ # React Frontend

│ ├── src/

|   |   |__ Pages/ 

│ └── public/

│

├── backend/ # Node + Express Backend

│ ├── routes/

│ ├── controllers/

│ ├── config/

│ └── models/

│ |__ Server.js

└── database/ # MySQL Database files



## Setup Backend

cd backend

npm install

npm start

Backend will run into: **http://localhost:5000**


## Frontend Setup

cd frontend

npm install

npm start


Frontend will run on: **http://localhost:3000**


## Database Setup
1. Download and Install MySQL

2.Write the SQL code, **Create Database cms** ,
Then import the folder of sql database.

## Authentication System

1. **JWT-based authentication**

2. **Password hashing using bcrypt**

3. **Role-based route protection**

4. **Middleware for authorization**


## Future Improvements

1. **Email verification system**

2. **Event calendar integration**

3. **Payment integration for club fees**



## Contributing

Pull requests are welcome.
For major changes, please open an issue first to discuss what you would like to change.


## License

This project is developed for academic purposes at JKKNIU.


## Developer

**Asif Hasan Plabon**

**B.Sc in Environmental Science & Engineering, JKKNIU**

**Aspiring Full Stack Web Developer**
