# API Endpoints Documentation

# Frontend-Backend Connection Setup

To enable your frontend to connect to this backend, ensure the following settings are configured in `config/settings.py`:

1. **CORS (Cross-Origin Resource Sharing):**

   - Install the CORS headers package:
     ```bash
     pip install django-cors-headers
     ```
   - Add `'corsheaders'` to `INSTALLED_APPS`.
   - Add `'corsheaders.middleware.CorsMiddleware'` to the top of the `MIDDLEWARE` list.
   - For development, you can allow all origins:
     ```python
     CORS_ALLOW_ALL_ORIGINS = True
     ```
   - For production, restrict to your frontend domain:
     ```python
     CORS_ALLOWED_ORIGINS = [
         'http://localhost:3000',  # Example React frontend
         'https://your-frontend-domain.com',
     ]
     ```

2. **ALLOWED_HOSTS:**
   - Add your frontend domain to the `ALLOWED_HOSTS` list:
     ```python
     ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[FRONTEND_DOMAIN]']
     ```

## Questions App

### 1. List Questions

- **Endpoint:** `/questions/list/`
- **Method:** GET
- **Description:** Returns a list of all questions. Optionally filter by type using the `type` query parameter.
- **Query Parameters:**
  - `type` (optional, string): Type of question to filter by
- **Response:** 200 OK, list of questions

## Users App

### 1. Register Applicant

- **Endpoint:** `/users/register/`
- **Method:** POST
- **Description:** Registers a new applicant or updates the name if the applicant already exists.
- **Request Body:**
  ```json
  {
    "iin": "001001001001",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Response:** 201 Created or 200 OK, applicant data

## Tests App

### 1. Get Personalized Questions

- **Endpoint:** `/tests/personalized/`
- **Method:** GET
- **Description:** Returns a personalized set of questions for a user based on their IIN and level. Requires `iin` as a query parameter.
- **Query Parameters:**
  - `iin` (required, string): Individual Identification Number
- **Response:** 200 OK, list of personalized questions
- **Errors:**
  - 404: Applicant not found
  - 403: Test already completed for this applicant
  - 400: Missing required parameters

### 2. Submit Answers

- **Endpoint:** `/tests/submit-answers/`
- **Method:** POST
- **Description:** Accepts user's answers, checks correctness, and returns the score.
- **Request Body:**
  ```json
  {
    "iin": "001001001001",
    "level": "A1",
    "answers": [
      {
        "question_id": 1,
        "selected_option": 3
      },
      {
        "question_id": 2,
        "selected_option": 1
      }
    ]
  }
  ```
- **Response:** 200 OK, test result data
- **Errors:**
  - 400: Invalid data or missing required fields
  - 404: Applicant not found

### 3. Get Test Results by IIN

- **Endpoint:** `/tests/results/`
- **Method:** GET
- **Description:** Returns a list of test results for the applicant with the given IIN.
- **Query Parameters:**
  - `iin` (required, string): Individual Identification Number
- **Response:** 200 OK, list of test results
- **Errors:**
  - 400: Missing IIN parameter
  - 404: Applicant not found

### 4. Get Test Results by IIN Batch

- **Endpoint:** `/tests/results/batch/`
- **Method:** POST
- **Description:** Returns test results for multiple applicants by their IINs.
- **Request Body:**
  ```json
  ["001001001001", "002002002002", "003003003003"]
  ```
- **Response:** 200 OK, list of test results
- **Errors:**
  - 400: Invalid request body or empty IIN list

---

## Other Endpoints

### 1. API Schema

- **Endpoint:** `/schema/`
- **Method:** GET
- **Description:** Returns the OpenAPI schema for the API.

### 2. Swagger UI

- **Endpoint:** `/schema/swagger-ui/`
- **Method:** GET
- **Description:** Swagger UI for interactive API documentation.

### 3. Redoc UI

- **Endpoint:** `/schema/redoc/`
- **Method:** GET
- **Description:** Redoc UI for interactive API documentation.

---

## Admin

### Django Admin

- **Endpoint:** `/admin/`
- **Description:** Django admin interface for managing models.
