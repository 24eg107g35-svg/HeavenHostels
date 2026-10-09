# HeavenHostels - Hostel Management System

A full-stack, enterprise-grade Hostel Management System designed for modern student accommodations, administrators, and wardens. Built with a **Spring Boot 4** backend and a **React + Vite** frontend.

---

## 🌟 Features

### 🎓 Student Portal
- **Secure Authentication:** JWT-based login, registration, and token refresh.
- **Profile Management:** View and manage personal information, assigned room, and course details.
- **Fee Management & History:** Check monthly payment statuses, view past transactions, and download official PDF receipts.
- **Password Recovery:** Email-based OTP verification for secure password resets.

### 🛡️ Admin Dashboard
- **Room Allocation:** Manage rooms, sharing capacity, and assign/reassign students.
- **Payment Processing:** Record offline cash payments, track paid/unpaid lists, and update statuses.
- **Student Directory:** Search, view, update, and manage student profiles.
- **Analytics & Status:** Quick visual overview of occupancy and pending dues.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS & Custom CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios with JWT interceptors
- **Icons & UI:** Lucide React & Modern UI components

### Backend
- **Framework:** Spring Boot 4 / Java 21
- **Security:** Spring Security with HS256 JWT & BCrypt password hashing
- **Database:** MySQL with Spring Data JPA / Hibernate
- **API Documentation:** OpenAPI 3 / Swagger UI (`/swagger-ui.html`)
- **Email Service:** Spring Mail (SMTP with OTP support)
- **PDF Generation:** OpenPDF for downloadable receipts
- **AI Integration:** Google Gemini Flash API integration

---

## 📁 Project Structure

```
HeavenHostels/
├── backend/                  # Spring Boot backend application
│   ├── src/
│   │   ├── main/java/        # Controllers, Services, Repositories, Models, DTOs
│   │   └── main/resources/   # Application properties & templates
│   ├── pom.xml               # Maven dependencies
│   └── mvnw / mvnw.cmd       # Maven wrapper
│
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page views (Admin, Student, Auth)
│   │   ├── services/         # API service helpers
│   │   └── api.js            # Axios client configuration
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.js        # Vite build configuration
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 21** or later
- **Node.js** (v18+ recommended) & npm
- **MySQL Server** (v8.0+)

### 1. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE hostel_management;
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure database credentials in `src/main/resources/application.properties` or via environment variables:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/hostel_management?createDatabaseIfNotExist=true&serverTimezone=UTC
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```
3. Run the Spring Boot server:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend API will run on `http://localhost:8080`.
   Access Swagger UI at `http://localhost:8080/swagger-ui.html`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 🔒 Security Best Practices
- Passwords and OTPs are hashed using BCrypt.
- Access tokens expire automatically; refresh tokens are rotated.
- Secrets and environment-specific configs are managed via `.env` and properties templates.

---

## 📄 License
This project is licensed under the MIT License.
