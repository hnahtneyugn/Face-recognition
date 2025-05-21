# Face Recognition Application using DeepFace

## Table of Contents
--- 
- [Authors](#authors)
- [Description](#description)
- [Technologies](#technologies-used)
- [Installation](#installation)
- [Features](#features)
- [Screenshots](#screenshots)
- [Future improvements](#future-improvements)
- [Contributing](#contributing)
- [Project status](#project-status)

## Authors
---
Group Bombardino Crocodilo
1. Dao Tu Phat - 23020409
2. Cao Minh Quang - 23020411
3. Hoang Minh Quyen - 23020421
4. Ta Nguyen Thanh - 23020437

## Description
---
A full-stack web application using DeepFace to help take attendance for employees of a company, teachers, lecturers from a school, institute, or simply a classroom full of students, using only face recognition. This app is deployed via Docker, runs smoothly on Windows, MacOS and Linux machines.

## Technologies Used
---
- Frontend
	- React
	- Typescript
- Backend
	- FastAPI
	- Tortoise ORM
- Database
	- PostgreSQL
	- Neon
- Deployment
	- Docker

## Installation
---
Follow these steps to install and run the app locally on your own machine.
1. Install [Docker Desktop](https://docs.docker.com/desktop/) on your local machine.
2. Pull these two images with these commands:

Frontend Docker Image:
[eddyandwhale/face-recognition-frontend-mac](https://hub.docker.com/r/eddyandwhale/face-recognition-frontend-mac)

```
docker pull eddyandwhale/face-recognition-frontend-mac
```

Backend Docker Image:
[eddyandwhale/face-recognition-backend-mac ](https://hub.docker.com/r/eddyandwhale/face-recognition-backend-mac)

```
docker pull eddyandwhale/face-recognition-backend-mac
```

3. Download the **docker-compose.yml** file.
4. Run only 1 single command:

```
docker-compose up -d
```

5. Navigate to the URL `localhost:3001` in your web browser to use the application.
6. Use an Admin account to log in. Otherwise, use accounts given to you from an Admin to log in as a User.

**NOTE**: Running `docker-compose up -d` is sufficient. The command will pull the images without having you do that manually.

## Features
---
- Admin/User authentication and authorization.
- As an Admin:
	- Create new accounts and give roles to them (either Admin or User).
	- Add, delete, modify a User.
	- Control the attendance of User list.
	- Search for attendance of a specific date.
- As a User:
	- Take attendance via face recognition.
	- See your own attendance history.
	- Ask your Admin to modify your information.

## Screenshots

## Future improvements
---
1. Users can modify their own information without having to ask for an Admin's permission.
2. Improve the speed of face recognition.
3. Upgrade the UI/UX for a better experience.
4. Improvements are limitless! So why not contribute to our project?

## Contributing
---
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Project status
--- 
This project is completed.
