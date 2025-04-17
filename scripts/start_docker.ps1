
# Build docker image
docker build -t signeo_app_front -f Dockerfile.dev .

# Run docker image
docker run -it --rm -p 3000:3000 --name signeo_project-signeo_app_front-1 signeo_app_front
