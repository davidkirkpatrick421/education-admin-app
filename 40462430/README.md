
**HEdClass - Web App**
*David Kirkpatrick - 40462430*

-- Setup and Installation Instructions --

1. Extract the ZIP folder '40462430.zip' to computer
2. Navigate to the root folder in terminal and run npm install to install node dependencies

3. Start MAMP DB server and verify it's running on PORT 8889 (Default MAMP). Confirm your MySQL MAMP credentials match the default used in the '.env' below, or edit these config values.
4. Navigate to phpMyAdmin in browser at 'http://localhost:8888/phpMyAdmin' and select import
5. Choose file and navigate to project folder 'src/seeder/data.sql' and import to create the database and seed sample test data

An '.env' environment variable file is included in the zip and the codebase uses this for all  config values with placeholders in the web and api server for robust adaptability and security to model production.

WEB_PORT=4000
API_PORT=5000
API_URL=http://localhost:5000

DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_NAME=40462430
DB_PORT=8889

6. In the project folder root '40462430' run command 'npm run dev' to start dev setup with API and webserver with nodemon concurrently

7. Open browser and navigate to 'http://localhost:4000'
8. Login with test credentials below to access the web app


-- Using the web-app --

The seed data is set up with 3 users to test the system; an admin role and 2 officers; 1 officer assigned to programme 1 and officer 2 assigned to programme 1 and 2. The passwords are saved as hash values in the database but are pre-hashed for the test users. Login details are:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@qub.ac.uk        | admin123   |
| Officer | officer1@qub.ac.uk     | officer123 |
| Officer | officer2@qub.ac.uk     | officer456 |

Both programmes, students and module results in the seed test data show a variety of test cases and variables across the site functionality.





