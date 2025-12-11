# Guns-Mart - Next.js Guns Shopping App

# Note to self
## 1. Use the docker hub and push images
## 2. Use only compose file
## 3. Create an terraform script 
- Install the docker and compose
- Pull the repository
- Run docker compose
- Will use the Packer for baking an golden image for this

Guns-Mart is a modern guns shopping app built with Next.js, React, and other technologies. It provides users with a seamless shopping experience for purchasing firearms. 

## Features

- View detailed product information, including images and specifications.
- Add items to the shopping cart.
- Increase, decrease and remove items from the cart.
- Responsive design for a great user experience on various devices.
- User can authenticate themselves using Bcrypt and JWT
- Implemented payment gateway with "Stripe".


## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios (for API requests)
- Mongoose
- MongoDb
- DaisyUi(For tailwind's customised buttons)
- JavaScript

## Pages to Visit

- **Mainpage:** Browse through the sample collection of guns.
- **Itempage:** View detailed information about a specific item.
- **Cartpage:** Manage your shopping cart and proceed to checkout.
- **Checkout:**  Checkout and Pay with card or Paypal.
- **Login**  To login into account
- **SignUp**  To signup the user


## Project Structure

- `app/page.tsx`: Contains Next.js pages.
- `helpers/`: Reusable React components.
- `dbconfig/`: Connecting mongoDb.
- `public/`: Static assets (images, fonts, etc.).
- `api/`: Serverless API functions.
- `models/`: Contains Mongoose model on which the cart works.




