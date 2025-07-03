#!/bin/bash

echo "Installing shadcn/ui components..."

# Core UI components
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add progress
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add table

echo "Installing npm packages..."

# Core dependencies
npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
npm install nodemailer @types/nodemailer
npm install react-hot-toast
npm install date-fns
npm install multer @types/multer
npm install socket.io socket.io-client @types/socket.io

echo "All dependencies installed successfully!"
