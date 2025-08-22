
# CareBridge

CareBridge is a comprehensive healthcare management system built with Django. It enables hospitals and clinics to manage patients, doctors, and their relationships, with secure authentication and a modern, responsive web interface.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Frontend](#frontend)
- [Testing](#testing)
- [License](#license)

---

## Features
- **User Authentication**: JWT and session-based login/register/logout
- **Role-based Models**: Custom `User`, `Patient`, `Doctor` models
- **Patient Management**: Add, edit, view, and delete patients
- **Doctor Management**: Add, edit, view, and delete doctors
- **Patient-Doctor Mapping**: Assign doctors to patients, view mappings
- **Audit Logging**: Track changes and assignments
- **RESTful API**: CRUD endpoints for all entities
- **Modern UI**: Responsive HTML/CSS/JS frontend with toast notifications
- **Admin Panel**: Django admin for superusers
- **Environment-based Config**: Uses `.env` for secrets and DB config

---

## Tech Stack
- **Backend**: Python 3.13, Django 5.2.5, Django REST Framework
- **Auth**: djangorestframework-simplejwt
- **Database**: PostgreSQL (default, configurable)
- **Frontend**: HTML, CSS, JavaScript
- **Other**: python-decouple, psycopg2

---

## Project Structure
```
CareBridge/
├── manage.py                # Django management script
├── requirements.txt         # Python dependencies
├── seed.py                  # (Optional) Data seeding script
├── .env                     # Environment variables
├── CareBridge/              # Django project config
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── main/                    # Main app
│   ├── __init__.py
│   ├── admin.py             # Admin registrations
│   ├── apps.py              # App config
│   ├── forms.py             # Django forms
│   ├── models.py            # Data models (User, Patient, Doctor, Mapping, AuditLog)
│   ├── serializers.py       # DRF serializers
│   ├── tests.py             # Unit tests
│   ├── urls.py              # App URL routes
│   ├── views.py             # Views (API + templates)
│   ├── migrations/          # DB migrations
│   └── templates/
│       └── main/            # HTML templates
├── static/                  # Static files
│   ├── images/              # Logo, favicon
│   ├── js/                  # scripts.js (frontend logic)
│   └── styles/              # style.css (custom styles)
└── templates/               # Base templates
    ├── main.html            # Main layout
    └── navbar.html          # Navbar partial
```

---

## Setup Instructions
1. **Clone the repository**
   ```powershell
   git clone <repo-url>
   cd CareBridge
   ```
2. **Create and activate a virtual environment**
   ```powershell
   python -m venv env
   .\env\Scripts\Activate.ps1
   ```
3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```
4. **Configure environment variables**
   - Copy `.env` from the repo and update values as needed:
     - `SECRET_KEY`, `DEBUG`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`, `ALLOWED_HOSTS`
5. **Apply migrations**
   ```powershell
   python manage.py migrate
   ```
6. **Create a superuser (for admin panel)**
   ```powershell
   python manage.py createsuperuser
   ```
7. **Run the development server**
   ```powershell
   python manage.py runserver
   ```
8. **Access the app**
   - Visit [http://localhost:8000](http://localhost:8000)
   - Admin panel: [http://localhost:8000/admin](http://localhost:8000/admin)

---

## Configuration
- **Environment Variables**: All sensitive and environment-specific settings are in `.env`.
- **Database**: Default is PostgreSQL. Update `.env` for your DB credentials.
- **Static & Media Files**: Static files are in `/static`. Templates are in `/templates`.

---

## Usage
- **Register/Login**: Users can register and log in via the web UI or API.
- **Patients/Doctors**: Add, edit, view, and delete patients/doctors.
- **Mappings**: Assign doctors to patients and view assignments.
- **Audit Logs**: Track changes and assignments (admin only).

---

## API Endpoints
| Endpoint                | Method | Description                       |
|------------------------|--------|-----------------------------------|
| `/api/patients/`       | GET    | List all patients                 |
| `/api/patients/`       | POST   | Create a new patient              |
| `/api/patients/<id>/`  | GET    | Retrieve patient details          |
| `/api/patients/<id>/`  | PUT    | Update patient                    |
| `/api/patients/<id>/`  | DELETE | Delete patient                    |
| `/api/doctors/`        | GET    | List all doctors                  |
| `/api/doctors/`        | POST   | Create a new doctor               |
| `/api/doctors/<id>/`   | GET    | Retrieve doctor details           |
| `/api/doctors/<id>/`   | PUT    | Update doctor                     |
| `/api/doctors/<id>/`   | DELETE | Delete doctor                     |
| `/api/mappings/`       | GET    | List all patient-doctor mappings  |
| `/api/mappings/`       | POST   | Create a new mapping              |
| `/api/token/`          | POST   | Obtain JWT token                  |
| `/api/token/refresh/`  | POST   | Refresh JWT token                 |

- All API endpoints require authentication (JWT or session).

---

## Frontend
- **Templates**: Located in `main/templates/main/` and `templates/`
- **Static Files**: CSS (`static/styles/style.css`), JS (`static/js/scripts.js`), images
- **Toast Notifications**: For feedback and errors
- **Navbar**: Dynamic links based on authentication status

---

## Testing
- **Unit Tests**: Run with
  ```powershell
  python manage.py test
  ```
- **Test Coverage**: Add more tests in `main/tests.py` as needed

---

## License
This project is for educational/demo purposes only. Not for production use.

---

## Contact
For questions or contributions, please open an issue or pull request.
