# API Endpoints Documentation

## Questions App

### 1. List Questions

- **Endpoint:** `/questions/list/`
- **Method:** GET
- **Description:** Returns a list of all questions. Optionally filter by type using the `type` query parameter.
- **Query Parameters:**
  - `type` (optional, string): Type of question to filter by
- **Response:** 200 OK, list of questions

### 2. Get Personalized Questions

- **Endpoint:** `/questions/personalized/`
- **Method:** GET
- **Description:** Returns a personalized set of questions for a user based on their IIN and level. Requires `iin` as a query parameter.
- **Query Parameters:**
  - `iin` (required, string): Individual Identification Number
- **Response:** 200 OK, list of personalized questions
- **Errors:**
  - 404: Applicant not found
  - 403: Test already completed for this applicant
  - 400: Missing required parameters

### 3. Submit Answers

- **Endpoint:** `/questions/submit/`
- **Method:** POST
- **Description:** Accepts user's answers, checks correctness, and returns the score.
- **Request Body:**
  - `iin` (string, required)
  - `level` (string, required)
  - `answers` (list, required): List of objects with `question_id` and `selected_option`
- **Response:** 200 OK, test result object
- **Errors:**
  - 400: Invalid or missing data
  - 404: Applicant not found

---

## Users App

### 1. Register Applicant

- **Endpoint:** `/users/register/`
- **Method:** POST
- **Description:** Registers a new applicant or updates the name if the applicant already exists.
- **Request Body:**
  - `iin` (string, required)
  - `first_name` (string, required)
  - `last_name` (string, required)
- **Response:** 201 Created or 200 OK, applicant object

### 2. Retrieve Test Results by IIN

- **Endpoint:** `/users/results/`
- **Method:** GET
- **Description:** Returns a list of test results for the applicant with the given IIN.
- **Query Parameters:**
  - `iin` (required, string): Individual Identification Number
- **Response:** 200 OK, list of test results
- **Errors:**
  - 400: Missing IIN parameter
  - 404: Applicant not found

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
