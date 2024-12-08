# Use official Node.js image as a base
FROM node:20 AS develop

# Set the working directory inside the container
WORKDIR /usr/src/api-social

# Copy the application code into the container
COPY . .

RUN npm cache clean --force

# Install dependencies
RUN npm install

# Run build
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
